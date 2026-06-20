import { query } from '../config/database';
import { logger } from '../config/logger';
import { detectCrisis } from './ai.service';
import { createHash } from 'crypto';
import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const HIGH_THRESHOLD = Number(process.env.CRISIS_DETECTION_CONFIDENCE_THRESHOLD ?? 0.80);
const MEDIUM_THRESHOLD = Number(process.env.CRISIS_MEDIUM_CONFIDENCE_THRESHOLD ?? 0.60);

export interface CrisisEvent {
  id: string;
  userId: string;
  severity: string;
  triggerSource: string;
  crisisResourceShown?: string;
  createdAt: Date;
}

export async function checkAndHandleCrisis(
  userId: string,
  content: string,
  source: 'chatbot' | 'community' | 'mood' | 'sos',
  countryCode: string
): Promise<{ crisisDetected: boolean; event?: CrisisEvent; resource?: any }> {
  const detection = await detectCrisis(content);

  if (!detection.crisisDetected || detection.confidence < MEDIUM_THRESHOLD) {
    return { crisisDetected: false };
  }

  const severity =
    detection.confidence >= HIGH_THRESHOLD
      ? detection.severity
      : 'medium';

  // Get crisis resource for country
  const resourceResult = await query(
    `SELECT * FROM crisis_resources WHERE country_code = $1 AND is_primary = true LIMIT 1`,
    [countryCode]
  );

  const resource = resourceResult.rows[0] ?? (
    await query(
      `SELECT * FROM crisis_resources WHERE country_code = 'US' AND is_primary = true LIMIT 1`
    )
  ).rows[0];

  // Log crisis event (hash content, never store plaintext)
  const contentHash = createHash('sha256').update(content).digest('hex');

  const eventResult = await query<CrisisEvent>(
    `INSERT INTO crisis_events
      (user_id, severity, trigger_source, trigger_content_hash, crisis_resource_shown, follow_up_scheduled)
     VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '1 hour')
     RETURNING *`,
    [userId, severity, source, contentHash, resource?.id]
  );

  const event = eventResult.rows[0];

  logger.info(
    { userId, severity, source, eventId: event.id },
    'Crisis event created'
  );

  // Schedule follow-up notification (queued for 1 hour)
  await scheduleFollowUpNotification(userId, event.id);

  return { crisisDetected: true, event, resource };
}

export async function markCallInitiated(eventId: string): Promise<void> {
  await query(
    `UPDATE crisis_events SET hotline_call_initiated = true WHERE id = $1`,
    [eventId]
  );
}

export async function markContactNotified(
  eventId: string,
  userId: string
): Promise<void> {
  await query(
    `UPDATE crisis_events SET emergency_contact_notified = true WHERE id = $1`,
    [eventId]
  );

  // Get emergency contact
  const contactResult = await query(
    `SELECT ec.*, up.display_name as user_name
     FROM emergency_contacts ec
     JOIN user_profiles up ON up.user_id = ec.user_id
     WHERE ec.user_id = $1 AND ec.notify_on_crisis = true
     LIMIT 1`,
    [userId]
  );

  const contact = contactResult.rows[0];
  if (!contact) return;

  try {
    await twilioClient.messages.create({
      to: contact.phone,
      from: process.env.TWILIO_FROM_NUMBER!,
      body: `Hi ${contact.name}. ${contact.user_name} from the InnerBrother app wanted you to know they might need your support right now. Please reach out to them. This is an automated message from InnerBrother.`,
    });
    logger.info({ userId, contactName: contact.name }, 'Emergency contact SMS sent');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to send emergency contact SMS');
  }
}

export async function markCrisisDismissed(eventId: string): Promise<void> {
  await query(
    `UPDATE crisis_events SET user_dismissed = true WHERE id = $1`,
    [eventId]
  );
}

async function scheduleFollowUpNotification(
  userId: string,
  crisisEventId: string
): Promise<void> {
  // Queue 1-hour follow-up
  await query(
    `INSERT INTO notification_queue (user_id, type, title, body, data, scheduled_for)
     VALUES ($1, 'crisis_followup', 'Checking in on you',
             'You went through something hard earlier. How are you doing now?',
             $2, NOW() + INTERVAL '1 hour')`,
    [userId, JSON.stringify({ crisis_event_id: crisisEventId })]
  );

  // Queue 24-hour check-in
  await query(
    `INSERT INTO notification_queue (user_id, type, title, body, data, scheduled_for)
     VALUES ($1, 'crisis_checkin_24h', 'A gentle check-in',
             'Yesterday was tough. Just wanted to see how you''re doing today.',
             $2, NOW() + INTERVAL '24 hours')`,
    [userId, JSON.stringify({ crisis_event_id: crisisEventId })]
  );
}

export async function createManualSOSEvent(
  userId: string,
  countryCode: string
): Promise<{ eventId: string; resource: any }> {
  const resourceResult = await query(
    `SELECT * FROM crisis_resources WHERE country_code = $1 AND is_primary = true LIMIT 1`,
    [countryCode]
  );

  const resource = resourceResult.rows[0];

  const eventResult = await query<{ id: string }>(
    `INSERT INTO crisis_events
      (user_id, severity, trigger_source, crisis_resource_shown, follow_up_scheduled)
     VALUES ($1, 'high', 'sos', $2, NOW() + INTERVAL '1 hour')
     RETURNING id`,
    [userId, resource?.id]
  );

  const eventId = eventResult.rows[0].id;
  await scheduleFollowUpNotification(userId, eventId);

  return { eventId, resource };
}
