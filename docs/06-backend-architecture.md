# InnerBrother — Backend Architecture

## Project Structure

```
backend/
├── package.json
├── tsconfig.json
├── .env.example
├── migrations/
│   └── 001_initial_schema.sql       # Full DB schema + seed data
└── src/
    ├── index.ts                     # Server entry, WebSocket, graceful shutdown
    ├── app.ts                       # Express app, middleware, routes
    ├── config/
    │   ├── database.ts              # PostgreSQL pool, query helper, transactions
    │   └── logger.ts                # Pino logger with PII redaction
    ├── middleware/
    │   └── auth.middleware.ts       # JWT verification, requireAuth, requirePremium
    ├── routes/
    │   ├── auth.routes.ts           # Register, login, refresh, logout
    │   ├── chat.routes.ts           # Conversations, messages, session end
    │   ├── crisis.routes.ts         # SOS, resources, event tracking
    │   └── goals.routes.ts          # Templates, CRUD, completions
    └── services/
        ├── ai.service.ts            # Claude API integration, crisis detection
        └── crisis.service.ts        # Crisis events, SMS, follow-up scheduling
```

## Request Lifecycle

```
Incoming Request
       │
       ▼
Helmet (security headers)
       │
       ▼
CORS validation
       │
       ▼
Rate Limiter (global: 100/15min, auth: 5/15min, chat: 60/hour)
       │
       ▼
JSON body parser (10kb limit)
       │
       ▼
Morgan request logger
       │
       ▼
Route handler
       │
       ├── requireAuth middleware
       │   ├── Verify JWT signature
       │   ├── Check session table (revocation check)
       │   └── Load user context (tier, country)
       │
       ├── Input validation (express-validator + Zod)
       │
       ├── Business logic
       │   └── For chat: Crisis detection pipeline first
       │
       └── Response
```

## AI Pipeline Architecture

```
Chat Message Received
         │
         ▼
[1] Keyword Pre-filter (< 1ms, no API call)
    CRISIS_KEYWORDS array check
         │
    ┌────┴────┐
  No match  Match
    │          │
    │          ▼
    │   [2] Claude Haiku 4.5 Crisis Classifier (< 500ms)
    │       Returns: { crisis_detected, severity, confidence }
    │          │
    │   ┌──────┴──────┐
    │  High (≥0.80)  Medium (0.60-0.79)
    │   │              │
    │   ▼              ▼
    │  CRISIS         Add resources
    │  PROTOCOL       to response,
    │  TRIGGERED      log event
    │
    ▼
[3] Claude Sonnet 4.6 Main Chat (< 3s)
    System prompt + conversation history
    Returns: reply text
         │
         ▼
[4] Claude Haiku 4.5 Struggle Classifier (async, non-blocking)
    Returns: { category, confidence }
         │
         ▼
[5] Store messages (encrypted), update conversation
         │
         ▼
[6] End of session: Generate session summary (async)
    Claude Sonnet 4.6 → store in ai_context_summaries
```

## Security Architecture

```
Authentication:
  JWT (RS256) → Access token (1h) + Refresh token (30d)
  Session table (revocation support)
  bcrypt (12 rounds) for passwords
  Timing-safe comparisons throughout

Encryption:
  Messages: AES-256-GCM at rest
  Emergency contacts: Stored encrypted
  Crisis content: SHA-256 hash only (never plaintext)
  TLS 1.3 in transit

Input Security:
  All user input sanitized before AI prompt injection
  Prompt injection patterns stripped
  Max 2000 chars per AI prompt input
  express-validator on all endpoints
  10kb body size limit

PII Handling:
  Pino logger redacts: email, phone, tokens
  No PII in logs ever
  Analytics: aggregated only, no individual tracking
  GDPR: data export + deletion within 30 days
```

## Database Architecture

```
Connection Pool: 20 connections (pg Pool)
ORM: Raw SQL with parameterized queries (no injection risk)
Transactions: Used for multi-table writes
Query monitoring: Slow query logging (> 1s)
Encryption key: Derived from JWT_SECRET via scrypt

Key tables by criticality:
  CRITICAL (crisis system):
    crisis_events → separate monitoring, 99.99% uptime
    crisis_resources → cached at app start

  HIGH (core features):
    users, user_profiles, user_sessions
    conversations, messages (encrypted)
    user_goals, goal_completions

  STANDARD:
    community_posts, post_replies
    mood_entries, feed_content
    notification_queue
```

## WebSocket Architecture (Community)

```
Socket.IO Server (ws://api.innerbrother.app/v1/ws)
         │
         ▼
Auth handshake: client sends JWT
JWT verified → socket.data.userId attached
         │
         ▼
Room management:
  socket.join('group:{group_id}') on join_group event
  socket.leave() on leave_group event
         │
         ▼
Broadcast events (via REST routes → io.to(room).emit()):
  new_post    → when POST /community/groups/:id/posts succeeds
  new_reply   → when POST /community/posts/:id/replies succeeds
  support_update → when POST /community/posts/:id/support succeeds
  crisis_alert → moderator rooms only
```

## Infrastructure Design

```
Production Stack:
  Load Balancer (AWS ALB)
       │
  ECS Fargate (2+ tasks, auto-scaling)
       │
  RDS PostgreSQL (Multi-AZ, automatic failover)
  ElastiCache Redis (session caching, rate limiting)
       │
  External Services:
    Claude API (primary AI)
    Firebase Admin SDK (push notifications)
    Twilio (emergency SMS)
    Stripe (billing)
    SendGrid (email)

Crisis Infrastructure (separate, redundant):
  Dedicated ECS task for crisis endpoints
  Separate RDS read replica for crisis queries
  CloudWatch alarm if crisis API > 99.9% error rate
  PagerDuty integration for immediate alerts
```
