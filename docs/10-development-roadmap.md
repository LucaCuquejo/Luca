# InnerBrother — Development Roadmap

---

## MVP (v1.0) — 12 Weeks

### Phase 1: Foundation (Weeks 1–3)

**Backend**
- [ ] PostgreSQL database setup + migrations
- [ ] Node.js/TypeScript project scaffold
- [ ] Authentication (email + OAuth Google/Apple)
- [ ] JWT session management
- [ ] User profile + onboarding API
- [ ] Country/crisis resources API
- [ ] Rate limiting + security middleware

**Frontend**
- [ ] Expo + React Native project setup
- [ ] Navigation architecture (React Navigation v6)
- [ ] Design system (colors, typography, spacing)
- [ ] Auth screens (Welcome, Login, Register)
- [ ] Onboarding flow (8 steps)
- [ ] Persistent Emergency Button component
- [ ] Crisis overlay component

**Infrastructure**
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging + Production environments
- [ ] Database backups configured
- [ ] Error monitoring (Sentry)
- [ ] Basic logging (Datadog or CloudWatch)

**Deliverable:** Users can register, onboard with country selection, and see the home screen.

---

### Phase 2: Core Features (Weeks 4–7)

**AI Chatbot**
- [ ] OpenAI/Claude API integration
- [ ] Crisis detection pre-filter (keyword + AI classifier)
- [ ] Main chatbot system prompt engineering
- [ ] Conversation persistence (PostgreSQL)
- [ ] Session summary generator
- [ ] Message encryption at rest
- [ ] Crisis event logging

**Crisis System**
- [ ] Crisis API endpoints
- [ ] Crisis overlay (full mobile implementation)
- [ ] One-tap phone calling integration
- [ ] Emergency contact SMS (Twilio)
- [ ] +1 hour follow-up notification
- [ ] Crisis resources by country

**Micro-Goals**
- [ ] Goal templates seed data
- [ ] User goals CRUD API
- [ ] Goal completion tracking
- [ ] Streak calculation
- [ ] XP system
- [ ] Goal completion celebration screen
- [ ] Level up / level down adaptive logic

**Daily Feed**
- [ ] Feed content library (100+ items)
- [ ] Content categorization by struggle
- [ ] Daily feed generation algorithm
- [ ] Feed API
- [ ] Feed UI with card components

**Deliverable:** Full chatbot + crisis system + goals + feed are functional.

---

### Phase 3: Community & Dashboard (Weeks 8–10)

**Community Hub**
- [ ] Group management API
- [ ] Real-time WebSocket server
- [ ] Post/reply CRUD
- [ ] Anonymous posting
- [ ] Support reactions
- [ ] Community crisis detection
- [ ] User reporting system
- [ ] Basic moderation tools
- [ ] Community UI screens

**Emotional Health Dashboard**
- [ ] Mood tracking API
- [ ] Mood entry UI (quick check-in)
- [ ] 7-day/30-day trend calculation
- [ ] Resilience score computation
- [ ] Dashboard UI with charts (Victory Native Charts)
- [ ] Milestones system
- [ ] Badge display

**Notifications**
- [ ] Firebase Cloud Messaging integration
- [ ] Daily check-in notification
- [ ] Goal reminder notification
- [ ] Crisis follow-up notification
- [ ] Notification preference management

**Deliverable:** Community hub live, dashboard showing real data, notifications working.

---

### Phase 4: Polish & Launch Prep (Weeks 11–12)

**Quality & Performance**
- [ ] Full E2E test suite (Detox)
- [ ] API unit tests (Jest)
- [ ] Load testing (k6)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance profiling + optimization
- [ ] Offline mode for critical features

**Security**
- [ ] Penetration testing
- [ ] GDPR compliance audit
- [ ] Privacy policy + Terms of Service (legal review)
- [ ] Data deletion flow
- [ ] Security headers audit

**App Store**
- [ ] iOS App Store listing
- [ ] Google Play Store listing
- [ ] App Store mental health content compliance
- [ ] Screenshots + preview video
- [ ] Beta testing (TestFlight + Play Internal Testing)

**Deliverable:** MVP ready for App Store + Play Store submission.

---

## MVP Feature Checklist

| Feature | Status |
|---------|--------|
| User registration + onboarding | Week 1-2 |
| Country-based crisis resources | Week 2 |
| AI daily check-in chatbot | Week 4-5 |
| Crisis detection + overlay | Week 5 |
| Emergency contact notification | Week 6 |
| Micro-goals system | Week 6-7 |
| Daily support feed | Week 7 |
| Community hub (basic) | Week 8-9 |
| Real-time chat (WebSocket) | Week 9 |
| Mood tracking | Week 9-10 |
| Emotional dashboard | Week 10 |
| Push notifications | Week 10-11 |
| App Store submission | Week 12 |

---

## V2.0 — Post-Launch (Months 4–8)

### V2.1 — Premium Features
- [ ] Advanced AI coaching (GPT-4 powered deeper sessions)
- [ ] AI-generated personalized daily content
- [ ] 90-day mood analytics + pattern insights
- [ ] Stripe billing integration (monthly + annual)
- [ ] Premium subscription management screen

### V2.2 — Community Enhancement
- [ ] Group video sessions (Weekly facilitated rooms)
- [ ] Direct messaging between community members
- [ ] Peer mentor program (experienced users helping new ones)
- [ ] Community leaderboards (opt-in)
- [ ] Group challenges (e.g., "7-day gratitude challenge")

### V2.3 — Health Integrations
- [ ] Apple Health integration (steps, sleep, heart rate)
- [ ] Google Fit integration
- [ ] Sleep quality correlation with mood
- [ ] Wearable data display in dashboard

### V2.4 — Professional Bridge
- [ ] Therapist directory integration (BetterHelp partnership)
- [ ] "Talk to a professional" soft referral flow
- [ ] GP letter template (user can generate a summary to share with doctor)
- [ ] Crisis resource expansion (40+ countries)

### V2.5 — Gamification & Social
- [ ] Achievement sharing (opt-in social sharing)
- [ ] Weekly community challenges
- [ ] Accountability partner pairing
- [ ] Group goals (e.g., "our group walks 100km this month")

---

## Team Structure (Recommended)

| Role | MVP | V2 |
|------|-----|----|
| Full-Stack Lead | 1 | 1 |
| Backend Engineer | 1 | 2 |
| React Native Engineer | 1 | 2 |
| AI/Prompt Engineer | 0.5 | 1 |
| UX/UI Designer | 0.5 | 1 |
| Mental Health Advisor (consultant) | 0.25 | 0.25 |
| QA Engineer | 0.5 | 1 |
| DevOps/Platform | 0.5 | 1 |

---

## Tech Stack Summary

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | React Native + Expo SDK 51+ |
| Navigation | React Navigation v6 |
| State | Redux Toolkit + RTK Query |
| Charts | Victory Native |
| Real-time | Socket.io client |
| Notifications | Expo Notifications + FCM |
| Storage | Expo SecureStore |
| Testing | Jest + React Native Testing Library + Detox |

### Backend
| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 20 LTS |
| Language | TypeScript 5 |
| Framework | Express.js |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| ORM | Prisma |
| Auth | Passport.js + JWT |
| Real-time | Socket.io |
| AI | Anthropic Claude API (primary) |
| SMS | Twilio |
| Notifications | Firebase Admin SDK |
| Email | SendGrid |
| Payments | Stripe |
| Testing | Jest + Supertest |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Cloud | AWS (or GCP) |
| Container | Docker + ECS Fargate |
| CI/CD | GitHub Actions |
| CDN | CloudFront |
| Monitoring | Datadog |
| Error Tracking | Sentry |
| Secrets | AWS Secrets Manager |
| Database Hosting | AWS RDS (PostgreSQL) |
| Redis Hosting | AWS ElastiCache |

---

## Cost Estimates (MVP)

| Service | Monthly Cost (est.) |
|---------|-------------------|
| AWS Infrastructure | $300–500 |
| Anthropic Claude API | $200–600 (usage-based) |
| Firebase (FCM) | Free tier |
| Twilio (SMS) | $50–150 |
| SendGrid (email) | $20 |
| Stripe (payments) | 2.9% + $0.30 per transaction |
| Sentry | $26 |
| Datadog | $30–100 |
| **Total** | **~$700–1,400/month** |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| AI crisis detection false negative | Medium | Critical | Human moderator backup, conservative thresholds |
| App Store rejection (mental health policies) | Medium | High | Pre-review with Apple/Google, legal review |
| Data breach | Low | Critical | Encryption, pen testing, minimal data collection |
| User crisis not followed up | Low | Critical | Automated follow-up system, monitoring |
| Claude API outage | Low | High | Fallback to cached responses, graceful degradation |
| GDPR non-compliance | Low | High | Legal audit before launch |
| Toxic community content | Medium | Medium | Real-time moderation + reporting |
