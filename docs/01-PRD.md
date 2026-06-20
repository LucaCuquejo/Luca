# InnerBrother — Product Requirements Document

**Version:** 1.0  
**Date:** 2026-06-20  
**Status:** Production-Ready Specification

---

## 1. Executive Summary

InnerBrother is a mobile-first wellbeing application designed specifically for men experiencing emotional struggles, isolation, and mental health challenges. The app bridges the gap between experiencing distress and seeking professional help by providing daily AI-powered check-ins, peer community support, micro-goal habit building, and immediate crisis intervention.

### Mission Statement
Help men identify emotional struggles early, reduce isolation, encourage healthy emotional expression, build resilience through small wins, and connect users with support systems before they reach a crisis point.

### Core Values
- **Non-judgmental**: Every interaction is warm, accepting, and free from shame
- **Action-oriented**: Small steps lead to big change
- **Safe**: Crisis support is always one tap away
- **Community**: You are never alone

---

## 2. Problem Statement

Men are statistically less likely to seek mental health support due to:
- Social stigma around emotional expression
- Lack of male-specific mental health resources
- Fear of appearing weak
- Absence of peer communities for emotional sharing
- Late intervention — seeking help only during crisis

**Consequences:**
- Men account for ~75% of suicides in most Western countries
- 1 in 8 men has a common mental health problem
- Men are far less likely than women to access psychological therapies

---

## 3. Target Users

### Primary Persona: "Marcus" — The Struggling Man
- Age: 25–55
- Going through divorce, job loss, or loneliness
- Has never sought therapy
- Skeptical but open to support if it feels non-clinical
- Needs: validation, community, small wins, crisis safety net

### Secondary Persona: "James" — The Recovery Builder
- In addiction recovery (smoking, alcohol, substances)
- Needs structured micro-goals and daily accountability
- Uses community features heavily

### Tertiary Persona: "David" — The Silent Sufferer
- Showing early signs of depression
- Socially withdrawn
- High suicide risk — critical user for crisis protocols

### Life Situations Covered
- Relationship breakdown / divorce
- Bereavement
- Job loss / financial stress
- Loneliness / social isolation
- Family conflict
- Addiction recovery (smoking, alcohol)
- Career stagnation
- Loss of purpose
- Low self-esteem
- Depression-related symptoms

---

## 4. Safety Principles (Non-Negotiable)

1. **No therapy claims**: The app never claims to be therapy or diagnose mental illness
2. **Persistent crisis button**: Visible from every screen at all times
3. **Automatic crisis detection**: AI monitors conversations for risk signals
4. **Country-based resources**: Correct hotlines displayed based on user's country
5. **Zero harm messaging**: Content never promotes self-harm, never uses guilt, never shames
6. **Mandatory crisis overlay**: Detected crisis language triggers immediate intervention screen
7. **Professional referral**: Always encourages seeking professional help alongside app use
8. **Data privacy**: Emotional data is encrypted and never sold

---

## 5. Feature Specifications

### 5.1 AI Check-In Chatbot

**Purpose:** Daily emotional temperature check and support conversation

**Behavioral Rules:**
- Opens with a warm, non-intrusive greeting
- Uses Motivational Interviewing (MI) principles:
  - Open-ended questions
  - Reflective listening responses
  - Affirmations of user's strengths
  - Summarizing and reframing
  - Developing discrepancy gently
- Never gives medical advice
- Never diagnoses conditions
- Always validates feelings before responding with suggestions
- Recognizes 10 struggle categories and tailors responses accordingly

**Struggle Categories:**
| Category | Keywords/Signals | Response Tone |
|----------|------------------|---------------|
| Financial | debt, money, broke, bills | Practical + empathetic |
| Relationship | breakup, divorce, cheating | Validation-first |
| Family | kids, parents, conflict | Connection-focused |
| Health | sick, pain, doctor | Supportive + resource-pointing |
| Addiction | drink, smoke, drugs, cravings | Non-judgmental + strength-based |
| Career | fired, job, boss, unemployed | Resilience + action-oriented |
| Loneliness | alone, isolated, no friends | Community-pointing |
| Self-esteem | worthless, failure, hate myself | Affirmation-heavy |
| Purpose | meaningless, pointless, no reason | Values exploration |
| Other | general distress | Open exploration |

**Crisis Detection Triggers:**
- "I want to die", "end my life", "kill myself", "not worth living"
- "no reason to live", "better off dead", "can't take it anymore" (with context)
- References to methods or planning
- Severe hopelessness language

**Conversation Features:**
- Session memory within conversation
- Trend tracking across sessions
- Personalized follow-up ("Last time you mentioned your job situation — how's that going?")
- Celebration of progress

### 5.2 Daily Support Feed

**Delivery:** Curated daily content refreshed at 6:00 AM user local time

**Content Types:**
1. **Morning Message** — Personalized motivational text based on current struggles
2. **Reflection Prompt** — One thoughtful question to journal about
3. **Emotional Awareness Exercise** — 2–5 minute guided exercise
4. **Reach Out Nudge** — Encouragement to contact a real person
5. **Victory Share** — Prompt to share a recent win in community

**Personalization Engine:**
- Maps user's active struggle categories to content library
- Avoids repetition (no same content within 30 days)
- Adjusts tone based on recent mood scores
- Premium users get AI-generated personalized content

### 5.3 Peer Support Hub

**Structure:**
- Anonymous profiles (username only, no real name required)
- Topic-based groups (static + user-created)
- Real-time chat (WebSocket)
- Post/Reply threading
- Upvoting / Support reactions ("I hear you", "Keep going", "Same here")

**Default Groups:**
- Breakup Recovery
- Fathers Under Stress
- Financial Recovery
- Smoking Cessation
- Career Setbacks
- Loneliness Support
- Anxiety Support
- Grief & Loss
- Addiction Recovery

**Moderation System:**
- Automated keyword filtering (real-time)
- User reporting
- Human moderator review queue
- 3-strike system for rule violations
- Community guidelines displayed on join
- Crisis content detection in community posts (same as chatbot)

**Community Rules:**
- No bullying or harassment
- No hate speech or discrimination
- No political discussions
- No promotion of self-harm
- No spam or advertising
- Mandatory anonymous posting (no doxxing)

### 5.4 Micro-Goals System

**Philosophy:** Small wins rebuild confidence. Never shame for missing. Always celebrate for doing.

**Goal Categories & Examples:**

**Smoking Cessation:**
- Level 1: Delay first cigarette by 15 minutes
- Level 2: Reduce daily count by 1
- Level 3: Complete 1 smoke-free hour
- Level 4: Complete a smoke-free morning
- Level 5: 1 smoke-free day

**Physical Activity:**
- Level 1: Walk 5 minutes outside
- Level 2: Walk 10 minutes
- Level 3: Stretch for 3 minutes
- Level 4: 15-minute walk
- Level 5: 30-minute walk or gym visit

**Social Connection:**
- Level 1: Send one text to a friend
- Level 2: Have a 5-minute phone call
- Level 3: Make plans with someone
- Level 4: Attend one social activity

**Mental Wellbeing:**
- Level 1: Journal for 2 minutes
- Level 2: Write down one thing you're grateful for
- Level 3: Identify and name one emotion today
- Level 4: Meditate for 5 minutes
- Level 5: Have a real conversation about how you feel

**Adaptive Difficulty:**
- If user completes 3+ consecutive: level up
- If user misses 2+ consecutive: level down (no shame messaging)
- System language: "Ready to try?" not "You failed"

**Streak System:**
- Streaks tracked per goal category
- Milestone celebrations at 3, 7, 14, 30, 60, 90 days
- Lost streak: "Fresh start" not "broken streak"

### 5.5 Emotional Health Dashboard

**Metrics Displayed:**
- 7-day and 30-day mood trend graph
- Stress level trend
- Goal completion rate (%)
- Community engagement score
- Personal growth milestones earned
- Emotional Resilience Score (composite metric)

**Emotional Resilience Score (0–100):**
- Mood stability: 25%
- Goal consistency: 25%
- Community engagement: 20%
- Check-in frequency: 20%
- Crisis-free days: 10%

**Milestone Badges:**
- "First Check-In"
- "7-Day Streak"
- "Community Connector" (first 5 posts)
- "Goal Achiever" (first completed goal)
- "30-Day Resilient"
- "Crisis Survivor" (handled sensitively, opt-in)

### 5.6 Crisis Detection & Intervention

**Detection Points:**
1. AI chatbot (real-time during conversation)
2. Community posts (automated moderation)
3. Mood check-in (extreme low scores with hopelessness indicators)
4. Manual SOS button

**Intervention Flow:**
1. Detection triggered
2. Normal app flow PAUSED
3. Crisis overlay appears (cannot be accidentally dismissed)
4. Warm, non-clinical message displayed
5. Local hotline number shown (country-specific)
6. One-tap call button
7. Option to notify emergency contact
8. Option to return to conversation (logged internally)
9. Follow-up check-in scheduled 1 hour later

**Post-Crisis Follow-Up:**
- Next-day gentle check-in from chatbot
- Resources shared in app
- Optional "tell us what happened" (never forced)

### 5.7 Country-Based Crisis Support

**Onboarding Flow:**
1. User selects country from list
2. Country stored encrypted in profile
3. Country-specific hotline loaded immediately
4. Hotline displayed in:
   - Settings screen
   - Emergency section
   - Crisis overlay
   - Daily feed footer

**Supported Countries (Launch):**
- United States: 988 Suicide & Crisis Lifeline
- United Kingdom: Samaritans 116 123
- Australia: Lifeline 13 11 14
- Canada: Crisis Services Canada 1-833-456-4566
- Ireland: Samaritans 116 123
- New Zealand: Lifeline 0800 543 354
- South Africa: SADAG 0800 456 789
- Germany: TelefonSeelsorge 0800 111 0 111
- France: Numéro national 3114
- Spain: Teléfono de la Esperanza 717 003 717
- Italy: Telefono Amico 02 2327 2327
- Brazil: CVV 188
- Mexico: SAPTEL 55 5259-8121
- India: iCall 9152987821
- Japan: Inochi no Denwa 0570-783-556

---

## 6. Monetization

### Free Tier
- Daily chatbot check-in (up to 10 messages/day)
- Community access (read + post)
- Basic micro-goals (up to 3 active goals)
- Daily support feed
- Crisis features (always free, never gated)

### Premium Tier ($9.99/month or $79.99/year)
- Unlimited chatbot conversations
- AI-generated personalized daily content
- Unlimited active goals + custom goals
- Advanced mood analytics (90-day trends)
- Emotional resilience deep insights
- Priority support group access
- Ad-free experience

### Free Trial
- 14-day free trial of Premium on signup

---

## 7. Non-Functional Requirements

### Performance
- App launch: < 2 seconds
- Chat response: < 3 seconds
- Feed load: < 1 second

### Availability
- 99.9% uptime SLA
- Crisis features: 99.99% uptime (redundant infrastructure)

### Security
- End-to-end encryption for messages
- AES-256 encryption at rest
- TLS 1.3 in transit
- Zero-knowledge architecture for emotional data
- GDPR + CCPA compliant
- Right to deletion within 30 days of request
- No selling of personal data — ever

### Accessibility
- WCAG 2.1 AA compliant
- Screen reader support
- Minimum contrast ratios met
- Large font support
- Haptic feedback for key actions

---

## 8. Success Metrics

### User Wellbeing
- 30-day mood trend improvement rate
- Crisis intervention activation rate
- Hotline call rate post-crisis detection
- User-reported wellbeing improvement (monthly NPS)

### Engagement
- Daily Active Users (DAU)
- Day 7 / Day 30 retention
- Average session length
- Goals completion rate
- Community post rate

### Safety
- Crisis detection accuracy (< 1% false negative target)
- Time to crisis overlay display (< 2 seconds)
- Hotline call rate during crisis events

---

## 9. Legal & Compliance

- Terms of Service clearly states app is NOT a medical device
- Privacy Policy is GDPR/CCPA compliant
- Crisis content carries mandatory safety disclaimers
- App Store / Play Store mental health content policies adhered to
- Regular safety audits with mental health professionals
- Medical disclaimer on every AI conversation
