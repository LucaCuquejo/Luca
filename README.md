# InnerBrother

**Men's Mental Wellbeing & Crisis Support App**

A production-ready mobile application helping men identify emotional struggles early, reduce isolation, build resilience through micro-goals, and access crisis support when they need it most.

---

## Deliverables

| # | Document | Location |
|---|----------|----------|
| 1 | Product Requirements Document | `docs/01-PRD.md` |
| 2 | Database Schema (PostgreSQL) | `docs/02-database-schema.md` |
| 3 | User Flows | `docs/03-user-flows.md` |
| 4 | Wireframes | `docs/04-wireframes.md` |
| 5 | React Native Architecture | `docs/05-react-native-architecture.md` |
| 6 | Backend Architecture | `docs/06-backend-architecture.md` |
| 7 | API Design | `docs/07-api-design.md` |
| 8 | AI Prompt Architecture | `docs/08-ai-prompt-architecture.md` |
| 9 | Crisis Intervention System | `docs/09-crisis-intervention.md` |
| 10 | Development Roadmap | `docs/10-development-roadmap.md` |

---

## Codebase Structure

```
InnerBrother/
├── docs/               ← All 10 deliverable documents
├── frontend/           ← React Native + Expo app
│   ├── App.tsx
│   ├── src/
│   │   ├── components/
│   │   │   ├── crisis/CrisisOverlay.tsx
│   │   │   └── common/ (EmergencyButton, MoodPicker, GoalCard, MessageBubble)
│   │   ├── screens/
│   │   │   ├── auth/ (Welcome, Onboarding)
│   │   │   └── main/ (Home, Chatbot, Goals)
│   │   ├── store/      ← Redux Toolkit
│   │   ├── services/   ← API client, crisis service
│   │   ├── navigation/ ← React Navigation
│   │   └── constants/  ← Theme, crisis resources (offline)
└── backend/            ← Node.js + TypeScript API
    ├── src/
    │   ├── routes/     (auth, chat, crisis, goals)
    │   ├── services/   (AI/Claude, crisis, notifications)
    │   ├── middleware/ (auth, rate limiting)
    │   └── config/     (database, logger)
    └── migrations/     ← Full PostgreSQL schema
```

---

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env
# Fill in: DATABASE_URL, ANTHROPIC_API_KEY, JWT_SECRET, etc.
npm install
psql $DATABASE_URL -f migrations/001_initial_schema.sql
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# Set EXPO_PUBLIC_API_URL in .env
npx expo start
```

---

## Safety Architecture

- **Persistent crisis button** — visible on every screen, works offline
- **Two-layer crisis detection** — keyword pre-filter + Claude Haiku AI classifier
- **Crisis never rate-limited** — crisis endpoints bypass all rate limits
- **Offline crisis resources** — 15 country hotlines bundled in the app
- **AES-256-GCM message encryption** — emotional data encrypted at rest
- **No plaintext crisis content** — only SHA-256 hashes stored in events
- **Emergency contact SMS** — via Twilio on user request during crisis

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo SDK 51 |
| State | Redux Toolkit |
| Navigation | React Navigation v6 |
| Backend | Node.js + TypeScript + Express |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| AI | Anthropic Claude API (Sonnet 4.6 + Haiku 4.5) |
| Real-time | Socket.IO |
| Push | Firebase Cloud Messaging |
| SMS | Twilio |
| Payments | Stripe |
| Auth | JWT + bcrypt |

---

## Disclaimer

InnerBrother is a wellbeing support tool — **not a therapist, psychologist, or medical device**. It does not diagnose mental health conditions. Users in crisis are always directed to real human support.
