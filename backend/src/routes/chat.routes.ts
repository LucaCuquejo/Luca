import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { query, transaction } from '../config/database';
import { chat, classifyStruggle, generateSessionSummary } from '../services/ai.service';
import { checkAndHandleCrisis } from '../services/crisis.service';
import { logger } from '../config/logger';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const router = Router();

// Simple AES-256-GCM encryption for message content
const ENCRYPTION_KEY = scryptSync(process.env.JWT_SECRET!, 'innerbrother-msgs', 32);

function encrypt(text: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(encrypted: string): string {
  const [ivHex, tagHex, contentHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const content = Buffer.from(contentHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(content).toString('utf8') + decipher.final('utf8');
}

// POST /chat/conversations — start a new conversation
router.post('/conversations', requireAuth, async (req, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    // Get user context
    const profileResult = await query(
      `SELECT up.display_name, up.country_code, up.active_struggles, up.subscription_tier,
              aic.summary as ai_summary,
              cr.hotline_display, cr.organization
       FROM user_profiles up
       LEFT JOIN ai_context_summaries aic ON aic.user_id = up.user_id
       LEFT JOIN crisis_resources cr ON cr.country_code = up.country_code AND cr.is_primary = true
       WHERE up.user_id = $1`,
      [authReq.userId]
    );

    const profile = profileResult.rows[0];

    // Check if conversation already exists for today
    const existingResult = await query(
      `SELECT id FROM conversations
       WHERE user_id = $1 AND session_date = CURRENT_DATE
       LIMIT 1`,
      [authReq.userId]
    );

    if (existingResult.rowCount > 0) {
      const convId = existingResult.rows[0].id;
      const firstMsg = await query(
        `SELECT content FROM messages WHERE conversation_id = $1 AND role = 'assistant' ORDER BY created_at LIMIT 1`,
        [convId]
      );
      const greeting = firstMsg.rows[0]?.content
        ? decrypt(firstMsg.rows[0].content)
        : `Hey ${profile?.display_name ?? 'there'}! How are you doing today?`;

      return res.json({ conversation_id: convId, greeting, session_date: new Date().toISOString().split('T')[0] });
    }

    // Generate greeting via AI
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const name = profile?.display_name ?? 'there';

    const greeting = await generateGreeting(name, timeGreeting, profile?.ai_summary);

    // Create conversation
    const convResult = await query<{ id: string }>(
      `INSERT INTO conversations (user_id, session_date) VALUES ($1, CURRENT_DATE) RETURNING id`,
      [authReq.userId]
    );
    const conversationId = convResult.rows[0].id;

    // Store greeting as first message
    await query(
      `INSERT INTO messages (conversation_id, user_id, role, content)
       VALUES ($1, $2, 'assistant', $3)`,
      [conversationId, authReq.userId, encrypt(greeting)]
    );

    res.status(201).json({
      conversation_id: conversationId,
      greeting,
      session_date: new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    logger.error({ error, userId: authReq.userId }, 'Failed to start conversation');
    res.status(500).json({ error: 'internal_error' });
  }
});

// POST /chat/conversations/:id/messages — send a message
router.post(
  '/conversations/:id/messages',
  requireAuth,
  [
    param('id').isUUID(),
    body('content').trim().isLength({ min: 1, max: 2000 }),
  ],
  async (req, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'validation_error', details: errors.array() });
    }

    const authReq = req as AuthenticatedRequest;
    const conversationId = req.params.id;
    const userContent: string = req.body.content;

    try {
      // Verify conversation belongs to user
      const convResult = await query(
        `SELECT c.id, up.display_name, up.country_code, up.active_struggles, up.subscription_tier,
                aic.summary as ai_summary,
                cr.hotline_display, cr.organization
         FROM conversations c
         JOIN user_profiles up ON up.user_id = c.user_id
         LEFT JOIN ai_context_summaries aic ON aic.user_id = c.user_id
         LEFT JOIN crisis_resources cr ON cr.country_code = up.country_code AND cr.is_primary = true
         WHERE c.id = $1 AND c.user_id = $2`,
        [conversationId, authReq.userId]
      );

      if (convResult.rowCount === 0) {
        return res.status(404).json({ error: 'not_found' });
      }

      const profile = convResult.rows[0];

      // CRISIS DETECTION (always runs, never rate-limited)
      const crisisCheck = await checkAndHandleCrisis(
        authReq.userId,
        userContent,
        'chatbot',
        authReq.countryCode
      );

      if (crisisCheck.crisisDetected && crisisCheck.event) {
        // Store user message
        await query(
          `INSERT INTO messages (conversation_id, user_id, role, content, crisis_score)
           VALUES ($1, $2, 'user', $3, 1.0)`,
          [conversationId, authReq.userId, encrypt(userContent)]
        );

        await query(
          `UPDATE conversations SET crisis_triggered = true WHERE id = $1`,
          [conversationId]
        );

        return res.json({
          message_id: null,
          crisis_detected: true,
          crisis_severity: crisisCheck.event.severity,
          crisis_event_id: crisisCheck.event.id,
          crisis_resource: crisisCheck.resource
            ? {
                organization: crisisCheck.resource.organization,
                hotline_display: crisisCheck.resource.hotline_display,
                hotline_number: crisisCheck.resource.hotline_number,
              }
            : null,
        });
      }

      // Load conversation history (last 20 messages)
      const historyResult = await query(
        `SELECT role, content FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [conversationId]
      );

      const history = historyResult.rows
        .reverse()
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: decrypt(m.content) }));

      // Add new user message to history for AI
      history.push({ role: 'user', content: userContent });

      // Get AI reply
      const { reply } = await chat(history, {
        userName: profile.display_name ?? 'there',
        activeStruggles: profile.active_struggles ?? [],
        country: profile.country_code,
        crisisLine: `${profile.organization}: ${profile.hotline_display}`,
        subscriptionTier: profile.subscription_tier,
        aiSummary: profile.ai_summary,
      });

      // Classify struggle from conversation
      const struggle = await classifyStruggle(userContent);

      // Store both messages
      const [userMsg, assistantMsg] = await transaction(async (client) => {
        const uMsg = await client.query(
          `INSERT INTO messages (conversation_id, user_id, role, content)
           VALUES ($1, $2, 'user', $3) RETURNING id, created_at`,
          [conversationId, authReq.userId, encrypt(userContent)]
        );

        const aMsg = await client.query(
          `INSERT INTO messages (conversation_id, user_id, role, content)
           VALUES ($1, $2, 'assistant', $3) RETURNING id, created_at`,
          [conversationId, authReq.userId, encrypt(reply)]
        );

        await client.query(
          `UPDATE conversations
           SET message_count = message_count + 2,
               struggle_identified = $2
           WHERE id = $1`,
          [conversationId, struggle.confidence > 0.6 ? struggle.category : null]
        );

        return [uMsg.rows[0], aMsg.rows[0]];
      });

      res.json({
        message_id: userMsg.id,
        reply: {
          id: assistantMsg.id,
          content: reply,
          role: 'assistant',
          created_at: assistantMsg.created_at,
        },
        crisis_detected: false,
        struggle_detected: struggle.confidence > 0.6 ? struggle.category : null,
      });
    } catch (error) {
      logger.error({ error, conversationId }, 'Chat message error');
      res.status(500).json({ error: 'internal_error' });
    }
  }
);

// POST /chat/conversations/:id/end
router.post(
  '/conversations/:id/end',
  requireAuth,
  [param('id').isUUID(), body('mood_end').optional().isInt({ min: 1, max: 10 })],
  async (req, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const conversationId = req.params.id;
    const moodEnd: number | undefined = req.body.mood_end;

    try {
      await query(
        `UPDATE conversations SET ended_at = NOW(), mood_end = $2 WHERE id = $1 AND user_id = $3`,
        [conversationId, moodEnd, authReq.userId]
      );

      // Generate session summary async (don't block response)
      generateAndStoreSummary(conversationId, authReq.userId).catch((err) =>
        logger.error({ err }, 'Failed to generate session summary')
      );

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'internal_error' });
    }
  }
);

async function generateGreeting(
  name: string,
  timeOfDay: string,
  previousContext?: string
): Promise<string> {
  const greetings = [
    `Hey ${name}! Good ${timeOfDay}. How are you doing today?`,
    `Good ${timeOfDay}, ${name}. How's your day going so far?`,
    `Hey ${name}, good to see you. How are you feeling this ${timeOfDay}?`,
  ];

  if (previousContext?.includes('work') || previousContext?.includes('career')) {
    return `Hey ${name}! Last time we talked about some work stuff. How's that been going?`;
  }

  return greetings[Math.floor(Math.random() * greetings.length)];
}

async function generateAndStoreSummary(
  conversationId: string,
  userId: string
): Promise<void> {
  const messages = await query(
    `SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at`,
    [conversationId]
  );

  const transcript = messages.rows
    .map((m) => `${m.role}: ${decrypt(m.content)}`)
    .join('\n');

  const existing = await query(
    `SELECT summary FROM ai_context_summaries WHERE user_id = $1`,
    [userId]
  );

  const summary = await generateSessionSummary(transcript, existing.rows[0]?.summary);

  await query(
    `INSERT INTO ai_context_summaries (user_id, summary, last_updated)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id) DO UPDATE SET summary = $2, last_updated = NOW()`,
    [userId, summary]
  );
}

export default router;
