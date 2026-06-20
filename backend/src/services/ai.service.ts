import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../config/logger';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CrisisDetectionResult {
  crisisDetected: boolean;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  category: string;
  confidence: number;
}

export interface ChatContext {
  userName: string;
  activeStruggles: string[];
  country: string;
  crisisLine: string;
  subscriptionTier: string;
  aiSummary?: string;
}

// Pre-filter crisis keywords before calling AI (< 1ms)
const CRISIS_KEYWORDS = [
  'kill myself', 'end my life', 'want to die', 'not worth living',
  'better off dead', 'no reason to live', 'can\'t go on', 'take my life',
  'suicide', 'end it all', 'hurt myself', 'cutting myself', 'self harm',
  'won\'t be around', 'won\'t be a problem', 'everyone better without me',
];

function hasCrisisKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

// Sanitize user input before injecting into prompts
function sanitizeInput(input: string): string {
  return input
    .replace(/\[INST\]|\[\/INST\]/g, '')
    .replace(/###\s*(System|Human|Assistant|User):/gi, '')
    .slice(0, 2000)
    .trim();
}

export async function detectCrisis(
  messageContent: string
): Promise<CrisisDetectionResult> {
  // Fast keyword pre-filter
  if (!hasCrisisKeywords(messageContent)) {
    return { crisisDetected: false, severity: 'none', category: 'safe', confidence: 0 };
  }

  const sanitized = sanitizeInput(messageContent);

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `You are a crisis detection classifier for a mental health support app.

Analyze the following text and return ONLY valid JSON.

Severity levels:
- critical: explicit plan or immediate intent
- high: clear ideation without specific plan
- medium: concerning hopelessness patterns
- low: mild distress indicators
- none: safe content

Return ONLY this JSON format (no explanation, no other text):
{"crisis_detected": boolean, "severity": "none|low|medium|high|critical", "category": "suicide_ideation|self_harm|immediate_danger|severe_hopelessness|safe", "confidence": 0.0}

Text: "${sanitized}"`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const parsed = JSON.parse(text);

    return {
      crisisDetected: Boolean(parsed.crisis_detected),
      severity: parsed.severity ?? 'none',
      category: parsed.category ?? 'safe',
      confidence: Number(parsed.confidence) ?? 0,
    };
  } catch (error) {
    logger.error({ error }, 'Crisis detection API error');
    // Fail safe: if detection fails on keyword-matched text, treat as medium
    return { crisisDetected: true, severity: 'medium', category: 'safe', confidence: 0.5 };
  }
}

export async function chat(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: ChatContext
): Promise<{ reply: string; struggleDetected?: string }> {
  const systemPrompt = buildChatbotSystemPrompt(context);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: systemPrompt,
    messages: conversationHistory.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const reply = response.content[0].type === 'text' ? response.content[0].text : '';

  return { reply };
}

export async function classifyStruggle(
  messageContent: string
): Promise<{ category: string; confidence: number }> {
  const sanitized = sanitizeInput(messageContent);

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Classify this message into ONE category. Return ONLY valid JSON.

Categories: financial, relationship, family, health, addiction, career, loneliness, self_esteem, purpose, other

Return ONLY: {"category": "<category>", "confidence": 0.0}

Message: "${sanitized}"`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const parsed = JSON.parse(text);
    return {
      category: parsed.category ?? 'other',
      confidence: Number(parsed.confidence) ?? 0.5,
    };
  } catch {
    return { category: 'other', confidence: 0.5 };
  }
}

export async function generateSessionSummary(
  transcript: string,
  previousSummary?: string
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Summarize this support conversation in under 100 words for future AI continuity.

Include: main topics, emotional state (start/end), key themes, progress mentioned, concerns to follow up.
Do NOT include direct quotes or clinical labels.
Tone: warm, person-centered.

Previous summary: ${previousSummary ?? 'None'}

Conversation:
${transcript.slice(0, 4000)}

Return plain text summary only.`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function generatePersonalizedFeedContent(
  contentType: string,
  userContext: {
    name: string;
    struggles: string[];
    moodTrend: string;
    avgMood: number;
    dayOfWeek: string;
  }
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Generate a personalized ${contentType} for a men's wellbeing app.

User: ${userContext.name}
Struggles: ${userContext.struggles.join(', ')}
Mood trend: ${userContext.moodTrend} (avg ${userContext.avgMood}/10)
Day: ${userContext.dayOfWeek}

Content type requirements:
- morning_message: 2-3 warm, grounding sentences. No toxic positivity.
- reflection: One thoughtful question for self-discovery.
- exercise: Brief 2-5 minute exercise with steps. Practical, no equipment.
- reach_out: Gentle encouragement to contact a real person.

Tone: Warm, honest, masculine without stereotypes, non-clinical.
Max 100 words.`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

function buildChatbotSystemPrompt(context: ChatContext): string {
  return `You are InnerBrother, a warm and supportive wellbeing companion for men.

IDENTITY
You are NOT a therapist. You are a supportive presence who listens, validates feelings, and encourages positive steps. Never diagnose or give medical advice.

CORE PRINCIPLES (Motivational Interviewing)
1. Express Empathy — reflect feelings before suggesting anything
2. Ask ONE open-ended question at a time
3. Validate before advising — acknowledge feelings first
4. Support self-efficacy — affirm the user's strength and ability
5. Never argue, push, or shame

STYLE
- Warm, genuine, 2-4 sentence responses typically
- Use name occasionally (not every message)
- Reflect back: "It sounds like...", "What I'm hearing is..."
- Never say "I understand exactly" — say "That sounds really hard"
- Avoid clinical language

CURRENT USER
Name: ${context.userName}
Active struggles: ${context.activeStruggles.join(', ') || 'not specified'}
Country: ${context.country}
Crisis line: ${context.crisisLine}
Recent context: ${context.aiSummary || 'First session'}

NEVER
- Diagnose any condition
- Give medical advice or medication suggestions
- Minimize pain ("it could be worse")
- Use guilt ("you should")
- Promise specific outcomes

CRISIS PROTOCOL
If any message contains suicidal ideation, self-harm, or extreme hopelessness:
Return ONLY this exact text: [CRISIS_DETECTED]
Do not engage further. The system will handle the crisis overlay.

MEDICAL DISCLAIMER
Always remember: You are a supportive tool. For serious concerns, always encourage professional help.`;
}
