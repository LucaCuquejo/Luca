# InnerBrother — API Design

**Base URL:** `https://api.innerbrother.app/v1`  
**Protocol:** HTTPS only  
**Auth:** Bearer JWT in `Authorization` header  
**Format:** JSON request/response  
**Rate Limiting:** Per-endpoint, per-user

---

## Authentication Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
X-App-Version: 1.0.0
X-Platform: ios | android
```

---

## Auth Endpoints

### POST /auth/register
```json
// Request
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "marcus92"
}

// Response 201
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "access_token": "jwt...",
  "refresh_token": "jwt...",
  "expires_in": 3600
}
```

### POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "SecurePass123!" }

// Response 200
{
  "user": { "id": "uuid", "email": "user@example.com" },
  "access_token": "jwt...",
  "refresh_token": "jwt...",
  "expires_in": 3600
}
```

### POST /auth/oauth
```json
// Request
{ "provider": "google", "oauth_token": "google_token_here" }

// Response 200 (same as login)
```

### POST /auth/refresh
```json
// Request
{ "refresh_token": "jwt..." }

// Response 200
{ "access_token": "jwt...", "expires_in": 3600 }
```

### POST /auth/logout
```
// Response 204 No Content
```

### POST /auth/forgot-password
```json
{ "email": "user@example.com" }
// Response 200 { "message": "Email sent if account exists" }
```

---

## User Profile Endpoints

### GET /users/me
```json
// Response 200
{
  "id": "uuid",
  "email": "user@example.com",
  "profile": {
    "username": "marcus92",
    "display_name": "Marcus",
    "country_code": "GB",
    "timezone": "Europe/London",
    "subscription_tier": "free",
    "active_struggles": ["career", "loneliness"],
    "onboarding_completed": true,
    "notifications_enabled": true,
    "avatar_color": "#4A9B8E"
  },
  "crisis_resource": {
    "organization": "Samaritans",
    "hotline_number": "116123",
    "hotline_display": "116 123",
    "available_hours": "24/7"
  }
}
```

### PUT /users/me
```json
// Request (partial update supported)
{
  "display_name": "Marcus",
  "country_code": "GB",
  "active_struggles": ["career", "loneliness"],
  "daily_feed_time": "08:00",
  "notifications_enabled": true
}
```

### POST /users/me/onboarding
```json
// Request
{
  "display_name": "Marcus",
  "country_code": "GB",
  "active_struggles": ["career", "loneliness"],
  "initial_mood": 5,
  "daily_feed_time": "08:00",
  "emergency_contact": {
    "name": "James",
    "phone": "+447700900123",
    "relationship": "Friend",
    "notify_on_crisis": true
  }
}

// Response 200
{
  "onboarding_completed": true,
  "crisis_resource": { ... },
  "suggested_goals": [ ... ]
}
```

### GET /users/me/emergency-contacts
### POST /users/me/emergency-contacts
```json
{
  "name": "James",
  "phone": "+447700900123",
  "relationship": "Friend",
  "notify_on_crisis": true
}
```

### DELETE /users/me/emergency-contacts/:id

---

## Chat / AI Endpoints

### POST /chat/conversations
```json
// Start new conversation
// Request: (empty body — uses current date)

// Response 201
{
  "conversation_id": "uuid",
  "greeting": "Hey Marcus! How's your day going?",
  "session_date": "2026-06-20"
}
```

### GET /chat/conversations
```json
// Response 200
{
  "conversations": [
    {
      "id": "uuid",
      "session_date": "2026-06-20",
      "mood_start": 5,
      "mood_end": 7,
      "struggle_identified": "career",
      "message_count": 12,
      "crisis_triggered": false,
      "started_at": "2026-06-20T08:05:00Z"
    }
  ],
  "pagination": { "total": 45, "page": 1, "per_page": 20 }
}
```

### POST /chat/conversations/:id/messages
```json
// Request
{ "content": "I've been really stressed about work lately" }

// Response 200
{
  "message_id": "uuid",
  "reply": {
    "id": "uuid",
    "content": "Work stress can really weigh on us. What's been going on there?",
    "role": "assistant",
    "created_at": "2026-06-20T08:06:00Z"
  },
  "crisis_detected": false,
  "struggle_detected": "career",
  "tokens_used": 145
}

// Response 200 (crisis detected)
{
  "message_id": "uuid",
  "crisis_detected": true,
  "crisis_severity": "high",
  "crisis_event_id": "uuid",
  "crisis_resource": {
    "organization": "Samaritans",
    "hotline_display": "116 123",
    "hotline_number": "116123"
  }
}
```

### GET /chat/conversations/:id/messages
```json
// Response 200
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "I've been really stressed about work",
      "created_at": "2026-06-20T08:06:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Work stress can really weigh on us...",
      "created_at": "2026-06-20T08:06:02Z"
    }
  ]
}
```

### POST /chat/conversations/:id/end
```json
// Request
{ "mood_end": 7 }

// Response 200
{
  "summary": "We talked about work stress...",
  "mood_improvement": 2,
  "suggested_goal": { ... }
}
```

---

## Mood Endpoints

### POST /mood/entries
```json
// Request
{
  "score": 7,
  "stress_level": 4,
  "energy_level": 6,
  "anxiety_level": 3,
  "note": "Feeling better after the walk",
  "source": "manual"
}

// Response 201
{
  "entry_id": "uuid",
  "recorded_at": "2026-06-20T10:00:00Z"
}
```

### GET /mood/trends
```json
// Query: ?period=7d|30d
// Response 200
{
  "period": "7d",
  "entries": [
    { "date": "2026-06-14", "avg_score": 5.5, "avg_stress": 6 },
    { "date": "2026-06-15", "avg_score": 6, "avg_stress": 5 }
  ],
  "summary": {
    "avg_mood": 6.2,
    "avg_stress": 4.8,
    "trend_direction": "improving",
    "resilience_score": 72
  }
}
```

---

## Goals Endpoints

### GET /goals/templates
```json
// Query: ?category=exercise|smoking|social|mental_wellbeing
// Response 200
{
  "templates": [
    {
      "id": "uuid",
      "category": "exercise",
      "title": "5-Minute Walk",
      "description": "Walk outside for just 5 minutes",
      "level": 1,
      "xp_reward": 10
    }
  ]
}
```

### GET /goals
```json
// Response 200
{
  "goals": [
    {
      "id": "uuid",
      "category": "exercise",
      "title": "10-Minute Walk",
      "current_level": 2,
      "current_streak": 4,
      "longest_streak": 7,
      "total_completions": 12,
      "last_completed_at": "2026-06-19T09:00:00Z",
      "is_active": true
    }
  ]
}
```

### POST /goals
```json
// Request
{
  "template_id": "uuid",  // optional — use template
  "category": "exercise",
  "title": "My custom walk goal",
  "is_custom": true
}

// Response 201
{ "goal": { ... } }
```

### POST /goals/:id/complete
```json
// Request
{ "note": "Went for a walk in the park. Felt great." }

// Response 200
{
  "completion_id": "uuid",
  "xp_earned": 15,
  "new_streak": 5,
  "level_up": false,
  "milestone_earned": null,
  "celebration_message": "5-day streak! You're building a real habit."
}
```

### PUT /goals/:id
```json
// Request (update level, pause, etc.)
{ "current_level": 3, "is_active": false }
```

### DELETE /goals/:id

---

## Community Endpoints

### GET /community/groups
```json
// Response 200
{
  "groups": [
    {
      "id": "uuid",
      "slug": "breakup-recovery",
      "name": "Breakup Recovery",
      "description": "...",
      "member_count": 1247,
      "post_count": 3891,
      "is_joined": true
    }
  ]
}
```

### POST /community/groups/:id/join
### DELETE /community/groups/:id/join

### GET /community/groups/:id/posts
```json
// Query: ?page=1&per_page=20
// Response 200
{
  "posts": [
    {
      "id": "uuid",
      "author": { "username": "Anonymous", "is_anonymous": true },
      "content": "Finally told my friends...",
      "support_count": 14,
      "reply_count": 3,
      "created_at": "2026-06-20T09:00:00Z",
      "user_supported": false
    }
  ],
  "pagination": { ... }
}
```

### POST /community/groups/:id/posts
```json
// Request
{
  "content": "Feeling a bit better today after 3 weeks...",
  "is_anonymous": true
}

// Response 201 (crisis check runs first)
{
  "post": { "id": "uuid", ... }
}

// Response 200 (crisis detected)
{
  "crisis_detected": true,
  "crisis_event_id": "uuid",
  "crisis_resource": { ... }
  // post NOT created
}
```

### POST /community/posts/:id/support
```json
{ "reaction_type": "support" }
// Response 200 { "support_count": 15 }
```

### DELETE /community/posts/:id/support

### GET /community/posts/:id/replies
### POST /community/posts/:id/replies
```json
{ "content": "Hang in there...", "is_anonymous": true }
```

### POST /community/posts/:id/report
```json
{ "reason": "harassment", "details": "Optional description" }
```

---

## Feed Endpoints

### GET /feed/today
```json
// Response 200
{
  "date": "2026-06-20",
  "items": [
    {
      "id": "uuid",
      "type": "morning_message",
      "title": "Thursday's Light",
      "body": "Every step forward, no matter how small, counts.",
      "is_premium": false
    },
    {
      "id": "uuid",
      "type": "reflection",
      "title": "Daily Reflection",
      "body": "What is one thing you can control today?",
      "is_premium": false
    },
    {
      "id": "uuid",
      "type": "exercise",
      "title": "2-Minute Breathing",
      "body": "Take 5 deep breaths. Inhale 4s, hold 4s, exhale 6s. Repeat.",
      "is_premium": false
    }
  ]
}
```

### POST /feed/:id/open
### POST /feed/:id/complete

---

## Crisis Endpoints

### POST /crisis/sos
```json
// Manual SOS trigger
// Request: (empty)

// Response 200
{
  "crisis_event_id": "uuid",
  "crisis_resource": {
    "organization": "Samaritans",
    "hotline_display": "116 123",
    "hotline_number": "116123",
    "available_hours": "24/7"
  }
}
```

### POST /crisis/:event_id/call-initiated
### POST /crisis/:event_id/contact-notified
### POST /crisis/:event_id/dismissed

### GET /crisis/resources
```json
// Returns country-specific crisis resources
// Response 200
{
  "primary": {
    "organization": "Samaritans",
    "hotline_display": "116 123",
    "hotline_number": "116123",
    "website_url": "https://samaritans.org",
    "available_hours": "24/7"
  },
  "additional": [ ... ]
}
```

---

## Dashboard Endpoints

### GET /dashboard/summary
```json
// Response 200
{
  "resilience_score": 72,
  "resilience_change": 5,
  "mood_7d_avg": 6.2,
  "mood_30d_avg": 5.8,
  "stress_7d_avg": 4.8,
  "goal_completion_rate_7d": 0.80,
  "streak_days": 4,
  "community_posts_7d": 3,
  "milestones_earned": ["first_checkin", "streak_7"],
  "mood_trend": [
    { "date": "2026-06-14", "score": 5 },
    { "date": "2026-06-15", "score": 6 }
  ]
}
```

---

## Notifications Endpoints

### PUT /notifications/fcm-token
```json
{ "fcm_token": "firebase_token_here" }
```

### PUT /notifications/preferences
```json
{
  "daily_checkin": true,
  "checkin_time": "08:00",
  "goal_reminders": true,
  "community_updates": false
}
```

---

## Billing Endpoints

### GET /billing/subscription
```json
// Response 200
{
  "tier": "free",
  "trial_ends_at": "2026-07-04T00:00:00Z",
  "features": {
    "daily_messages_limit": 10,
    "active_goals_limit": 3,
    "advanced_analytics": false,
    "ai_personalization": false
  }
}
```

### POST /billing/create-checkout
```json
{ "plan": "monthly" | "annual" }
// Response 200 { "checkout_url": "https://checkout.stripe.com/..." }
```

### POST /billing/portal
```json
// Returns Stripe customer portal URL
// Response 200 { "portal_url": "..." }
```

---

## Error Responses

```json
// 400 Bad Request
{ "error": "validation_error", "details": { "field": "message" } }

// 401 Unauthorized
{ "error": "unauthorized", "message": "Token expired" }

// 403 Forbidden
{ "error": "forbidden", "message": "Premium feature" }

// 404 Not Found
{ "error": "not_found" }

// 429 Rate Limited
{ "error": "rate_limited", "retry_after": 60 }

// 500 Server Error
{ "error": "internal_error", "request_id": "uuid" }
```

---

## WebSocket Events (Real-time Community)

```
ws://api.innerbrother.app/v1/ws

// Auth: send on connect
{ "type": "auth", "token": "jwt..." }

// Join group
{ "type": "join_group", "group_id": "uuid" }

// New post event (received)
{
  "type": "new_post",
  "group_id": "uuid",
  "post": { "id": "uuid", "content": "...", "author": {...} }
}

// New reply event (received)
{
  "type": "new_reply",
  "post_id": "uuid",
  "reply": { ... }
}

// Support count update (received)
{
  "type": "support_update",
  "post_id": "uuid",
  "support_count": 15
}

// Crisis alert (received — for moderators only)
{
  "type": "crisis_alert",
  "post_id": "uuid",
  "severity": "high"
}
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/login | 5 | 15 min |
| POST /chat/messages | 60 | 1 hour (free), unlimited (premium) |
| POST /community/posts | 10 | 1 hour |
| POST /mood/entries | 20 | 1 day |
| POST /crisis/sos | No limit | — |
| GET /* | 1000 | 1 hour |
