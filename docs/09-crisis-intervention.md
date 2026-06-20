# InnerBrother — Crisis Intervention System Design

---

## 1. Overview

The Crisis Intervention System is InnerBrother's highest-priority safety feature. It operates across all user touchpoints, is always available, never gateable by subscription, and is designed to bridge users from distress to real-world help as quickly as possible.

**Design Principles:**
- Speed: Crisis overlay appears within 2 seconds of detection
- Warmth: Language is human, not clinical, not alarming
- Agency: User always has choice; never forcibly locked into crisis flow
- Connection: Immediately bridges to real humans (hotlines, emergency contacts)
- Follow-up: Crisis is not forgotten after the overlay closes
- Privacy: Crisis event content is hashed, never stored as plaintext

---

## 2. Detection Layers

### Layer 1: Real-Time Message Analysis
Every user message in the chatbot goes through a two-stage pipeline:

```
User Message
     │
     ▼
[Stage 1] Keyword Pre-Filter (< 5ms)
     │
     ├─ No keywords → Pass to main AI
     │
     └─ Keywords found → [Stage 2] AI Crisis Classifier (< 500ms)
                              │
                              ├─ confidence < 0.60 → Add resources to AI reply
                              ├─ confidence 0.60-0.79 → Gentle check + resources
                              └─ confidence >= 0.80 → CRISIS PROTOCOL TRIGGERED
```

**Stage 1 Keyword List (maintained server-side, updated by safety team):**
```
Primary triggers (auto-trigger Stage 2):
- "kill myself", "end my life", "want to die", "not worth living"
- "better off dead", "no reason to live", "can't go on"
- "take my life", "suicide", "end it all"
- "no point anymore" (with preceding negative context)

Secondary triggers (trigger Stage 2 with context):
- "hurt myself", "cutting", "self harm"
- "nobody cares", "everyone hates me" (with high-severity tone)
- "can't take it anymore", "give up on life"
- "won't be around much longer", "won't be a problem"
```

### Layer 2: Community Post Filter
All community posts are analyzed before publishing:

```
Post Submitted
     │
     ▼
AI Safety Classifier (< 1s)
     │
     ├─ Safe → Post published
     ├─ Crisis detected → CRISIS PROTOCOL triggered, post held
     │                    (post may be published after crisis flow)
     └─ Rule violation → Post blocked, error shown
```

### Layer 3: Mood Entry Monitoring
```
Mood Entry (score <= 2)
     │
     ▼
Check note field for crisis language
     │
     ├─ No crisis language → Log low mood, trigger follow-up notification
     └─ Crisis language detected → CRISIS PROTOCOL triggered
```

### Layer 4: Manual SOS
- 🆘 button always visible in top-right of every screen
- Long press (0.5s) opens Quick Access sheet
- Tap on Quick Access "Open Crisis Resources" → Crisis overlay (no AI needed)

---

## 3. Crisis Protocol — Technical Flow

```
CRISIS DETECTED
     │
     ▼
1. Emit crisis:detected event to frontend (WebSocket or API response flag)
2. Frontend immediately pauses all normal operation
3. Create crisis_event record in database:
   - user_id
   - severity
   - trigger_source
   - trigger_content_hash (SHA-256 of content, NOT plaintext)
   - crisis_resource_shown
   - created_at
4. Fetch user's country-specific crisis resource
5. Display Crisis Overlay (full-screen, z-index: MAX)
6. Schedule follow-up notification (+1 hour)
7. Schedule next-day check-in (+24 hours)
```

---

## 4. Crisis Overlay — UX Specification

```
DISPLAY RULES:
- Full screen takeover
- Cannot be swiped away
- Cannot be dismissed by back button
- Only dismissable via:
  a) Tapping a phone number (phone dialer opens)
  b) Tapping "Alert emergency contact"
  c) Tapping "I'm safe — return to app"
- All three options log the user's choice

VISUAL DESIGN:
- Background: Deep navy (#1B2A4A) with subtle warmth gradient
- Text: White, large and readable
- Primary CTA: Soft teal phone button
- No red colors (avoid alarm/danger feeling)
- Gentle animation (breathing pulse on phone button)

COPY (tone: human, warm, non-clinical):
Header: "We're right here with you."
Body: "It sounds like things are really hard right now. That matters. 
       Real support is available, right now, for you."
Hotline label: "[Organization Name]"
Hotline CTA: "📞 [NUMBER] — Tap to call"
Subtext: "Free. Confidential. 24/7. You don't have to explain everything."
Emergency contact CTA: "Let [Contact Name] know I need support"
Return CTA: "I'm okay right now — go back"
Footer: "InnerBrother will check in with you soon. You're not alone."
```

---

## 5. Crisis Follow-Up System

### +1 Hour Notification
```
Title: "Checking in on you"
Body: "You went through something hard earlier. How are you doing now?"
Action: Opens chatbot with gentle opening message
```

### Chatbot Follow-Up Opening
```
AI receives context: [crisis_followup: true, hours_since: 1]
System prompt addendum:
"This user experienced a crisis event approximately 1 hour ago. 
 Open very gently. Check how they are. Do not reference the specific 
 crisis content. Be present and warm. If they seem stable, gently 
 affirm their strength. If still in distress, re-activate crisis protocol.
 Do not push them to talk about what happened."

AI opening message:
"Hey [name]. Just checking in. How are you doing right now?"
```

### +24 Hour Check-In
```
Chatbot opens with:
"Yesterday was a tough day. I wanted to see how you're doing today. 
 You don't need to talk about what happened — I just want you to know 
 I'm here. How are you feeling?"
```

---

## 6. Emergency Contact Notification

When user taps "Alert emergency contact":

```
1. Check if user has emergency contact with notify_on_crisis = true
   └─ If none → Show prompt to add contact, then re-offer
   
2. Log crisis_event.emergency_contact_notified = true

3. Send SMS via Twilio:
   "Hi [contact_name]. [user_display_name] from the InnerBrother app 
    wanted you to know they might need your support right now. 
    Please reach out to them. This is an automated message from InnerBrother."

4. Show confirmation in overlay:
   "✓ [Contact Name] has been notified. They'll reach out soon."
```

---

## 7. Post-Crisis Safety Plan

After a critical crisis event, the next chatbot session offers:

```
"Would you like to put together a quick personal safety plan? 
 It's just a short list of steps you can take if things get hard again. 
 It can make a big difference."

If YES:
Step 1: "What are 2-3 warning signs that you're starting to struggle?"
Step 2: "Who are 1-2 people you trust that you could call?"
Step 3: "What's one thing that always helps you feel a bit better?"
Step 4: "What's the crisis line for your country?" (pre-filled)

Stored as: user_safety_plans table
Accessible from: Settings → My Safety Plan
```

---

## 8. Moderator Crisis Alerts

For crisis content detected in community:

```
1. WebSocket event sent to moderation dashboard:
   {
     "type": "crisis_alert",
     "post_id": "uuid",
     "severity": "high",
     "user_anonymous": true,
     "group_name": "Breakup Recovery"
   }

2. Post is temporarily held (not published)
3. Moderator sees anonymized post + crisis resources
4. Moderator can:
   a) Publish with crisis resources appended
   b) Remove post and trigger user crisis protocol
   c) Escalate to senior moderator

4. User always receives crisis overlay regardless of moderator action
```

---

## 9. Crisis Data & Privacy

**What is stored:**
- crisis_event record (user ID, severity, timestamp, source)
- Whether hotline call was initiated (boolean)
- Whether emergency contact was notified (boolean)
- Whether user dismissed overlay (boolean)
- SHA-256 hash of triggering content (for analysis only, not reversible)

**What is NEVER stored:**
- The actual words/message that triggered detection
- User's location during crisis event
- Contact details of emergency contacts (stored separately, encrypted)

**Retention:**
- Crisis events retained for 2 years (for safety analysis + user's own review)
- User can request deletion (GDPR right to erasure) — events anonymized

---

## 10. Crisis System Infrastructure

**Reliability Requirements:**
- Crisis overlay display: < 2 second from detection
- Crisis API endpoints: 99.99% availability (separate redundant infrastructure)
- Crisis detection never blocked by rate limiting
- Hotline numbers cached locally on device (available offline)

**Monitoring:**
- PagerDuty alert if crisis detection service latency > 3s
- PagerDuty alert if crisis API error rate > 1%
- Weekly safety audit of crisis event logs (anonymized)
- Monthly review of crisis detection accuracy with mental health advisor

---

## 11. Country Crisis Resources — Complete List

| Country | Organization | Number | Hours |
|---------|-------------|--------|-------|
| US | 988 Suicide & Crisis Lifeline | 988 | 24/7 |
| GB | Samaritans | 116 123 | 24/7 |
| AU | Lifeline | 13 11 14 | 24/7 |
| CA | Crisis Services Canada | 1-833-456-4566 | 24/7 |
| IE | Samaritans | 116 123 | 24/7 |
| NZ | Lifeline | 0800 543 354 | 24/7 |
| ZA | SADAG | 0800 456 789 | 24/7 |
| DE | TelefonSeelsorge | 0800 111 0 111 | 24/7 |
| FR | Numéro national prévention suicide | 3114 | 24/7 |
| ES | Teléfono de la Esperanza | 717 003 717 | 24/7 |
| IT | Telefono Amico | 02 2327 2327 | Business hours |
| BR | Centro de Valorização da Vida | 188 | 24/7 |
| MX | SAPTEL | 55 5259-8121 | 24/7 |
| IN | iCall | 9152987821 | Mon-Sat 8am-10pm |
| JP | Inochi no Denwa | 0570-783-556 | 24/7 |
| SG | Samaritans of Singapore | 1767 | 24/7 |
| PH | In Touch Crisis Line | 1800-1888-1553 | 24/7 |
| KE | Befrienders Kenya | 0800 723 253 | 24/7 |
| NG | SURPIN | 234-806-210-6493 | 24/7 |
