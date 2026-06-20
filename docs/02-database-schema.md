# InnerBrother — Database Schema

**Database:** PostgreSQL 15+  
**Encoding:** UTF-8  
**Extensions:** `uuid-ossp`, `pgcrypto`, `pg_trgm`

---

## Schema Overview

```
innerbrother/
├── auth schema      — users, sessions, oauth
├── profile schema   — user profiles, countries, settings
├── chat schema      — conversations, messages, AI context
├── goals schema     — goal definitions, user goals, progress
├── mood schema      — mood entries, trends
├── community schema — groups, posts, replies, reports
├── feed schema      — content library, personalized feeds
├── crisis schema    — crisis events, resources, contacts
└── billing schema   — subscriptions, payments
```

---

## Full SQL Schema

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'premium');
CREATE TYPE goal_category AS ENUM (
  'smoking', 'exercise', 'social', 'mental_wellbeing',
  'nutrition', 'sleep', 'alcohol', 'custom'
);
CREATE TYPE struggle_category AS ENUM (
  'financial', 'relationship', 'family', 'health',
  'addiction', 'career', 'loneliness', 'self_esteem',
  'purpose', 'other'
);
CREATE TYPE mood_level AS ENUM ('1','2','3','4','5','6','7','8','9','10');
CREATE TYPE crisis_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'actioned', 'dismissed');
CREATE TYPE moderation_action AS ENUM ('warning', 'temp_ban', 'perm_ban', 'content_removed');

-- ============================================================
-- USERS & AUTH
-- ============================================================

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             TEXT UNIQUE,
  email_verified    BOOLEAN DEFAULT FALSE,
  password_hash     TEXT,
  oauth_provider    TEXT,
  oauth_provider_id TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  last_active_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL,
  device_info   JSONB,
  ip_address    INET,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ
);

CREATE TABLE password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_verification_tokens (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER PROFILES
-- ============================================================

CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username              TEXT UNIQUE NOT NULL,
  display_name          TEXT,
  country_code          TEXT NOT NULL,
  timezone              TEXT DEFAULT 'UTC',
  subscription_tier     subscription_tier DEFAULT 'free',
  premium_expires_at    TIMESTAMPTZ,
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  active_struggles      struggle_category[],
  daily_feed_time       TIME DEFAULT '08:00:00',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  fcm_token             TEXT,
  avatar_color          TEXT DEFAULT '#1B4F72',
  bio                   TEXT,
  is_anonymous          BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emergency_contacts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  phone        TEXT NOT NULL,  -- stored encrypted
  relationship TEXT,
  notify_on_crisis BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_privacy_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allow_analytics       BOOLEAN DEFAULT TRUE,
  allow_personalization BOOLEAN DEFAULT TRUE,
  data_retention_days   INTEGER DEFAULT 365,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COUNTRIES & CRISIS RESOURCES
-- ============================================================

CREATE TABLE countries (
  code         TEXT PRIMARY KEY,  -- ISO 3166-1 alpha-2
  name         TEXT NOT NULL,
  flag_emoji   TEXT,
  timezone_default TEXT
);

CREATE TABLE crisis_resources (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code    TEXT NOT NULL REFERENCES countries(code),
  organization    TEXT NOT NULL,
  hotline_number  TEXT NOT NULL,
  hotline_display TEXT NOT NULL,
  website_url     TEXT,
  available_hours TEXT DEFAULT '24/7',
  language        TEXT DEFAULT 'en',
  is_primary      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHATBOT / CONVERSATIONS
-- ============================================================

CREATE TABLE conversations (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at     TIMESTAMPTZ DEFAULT NOW(),
  ended_at       TIMESTAMPTZ,
  struggle_identified struggle_category,
  mood_start     INTEGER CHECK (mood_start BETWEEN 1 AND 10),
  mood_end       INTEGER CHECK (mood_end BETWEEN 1 AND 10),
  crisis_triggered BOOLEAN DEFAULT FALSE,
  message_count  INTEGER DEFAULT 0,
  ai_summary     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            message_role NOT NULL,
  content         TEXT NOT NULL,  -- stored encrypted
  content_hash    TEXT,
  tokens_used     INTEGER,
  crisis_score    FLOAT,
  crisis_flags    TEXT[],
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_context_summaries (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary      TEXT NOT NULL,  -- compressed context for AI continuity
  struggles    struggle_category[],
  key_themes   TEXT[],
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MOOD TRACKING
-- ============================================================

CREATE TABLE mood_entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score         INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  stress_level  INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  energy_level  INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  anxiety_level INTEGER CHECK (anxiety_level BETWEEN 1 AND 10),
  note          TEXT,
  source        TEXT DEFAULT 'manual',  -- 'manual', 'chatbot', 'daily_feed'
  recorded_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mood_trends (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avg_mood_7d     FLOAT,
  avg_mood_30d    FLOAT,
  avg_stress_7d   FLOAT,
  avg_stress_30d  FLOAT,
  trend_direction TEXT,  -- 'improving', 'stable', 'declining'
  computed_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GOALS SYSTEM
-- ============================================================

CREATE TABLE goal_templates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category    goal_category NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  level       INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
  duration_minutes INTEGER,
  xp_reward   INTEGER DEFAULT 10,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_goals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id       UUID REFERENCES goal_templates(id),
  category          goal_category NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  current_level     INTEGER DEFAULT 1,
  target_level      INTEGER DEFAULT 5,
  is_custom         BOOLEAN DEFAULT FALSE,
  is_active         BOOLEAN DEFAULT TRUE,
  current_streak    INTEGER DEFAULT 0,
  longest_streak    INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  last_completed_at TIMESTAMPTZ,
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goal_completions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id    UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  level      INTEGER NOT NULL,
  note       TEXT,
  xp_earned  INTEGER DEFAULT 10,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goal_streaks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id        UUID NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  streak_count   INTEGER DEFAULT 0,
  streak_start   DATE,
  last_activity  DATE,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXPERIENCE & MILESTONES
-- ============================================================

CREATE TABLE user_xp (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_xp    INTEGER DEFAULT 0,
  level       INTEGER DEFAULT 1,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE milestones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  xp_reward   INTEGER DEFAULT 50,
  is_active   BOOLEAN DEFAULT TRUE
);

CREATE TABLE user_milestones (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_id UUID NOT NULL REFERENCES milestones(id),
  earned_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, milestone_id)
);

-- ============================================================
-- COMMUNITY
-- ============================================================

CREATE TABLE community_groups (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  icon         TEXT,
  category     struggle_category,
  member_count INTEGER DEFAULT 0,
  post_count   INTEGER DEFAULT 0,
  is_official  BOOLEAN DEFAULT TRUE,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_memberships (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id   UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  is_muted   BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, group_id)
);

CREATE TABLE community_posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id        UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  is_anonymous    BOOLEAN DEFAULT TRUE,
  support_count   INTEGER DEFAULT 0,
  reply_count     INTEGER DEFAULT 0,
  is_pinned       BOOLEAN DEFAULT FALSE,
  is_removed      BOOLEAN DEFAULT FALSE,
  crisis_flagged  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_replies (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id        UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES post_replies(id),
  content        TEXT NOT NULL,
  is_anonymous   BOOLEAN DEFAULT TRUE,
  support_count  INTEGER DEFAULT 0,
  is_removed     BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_supports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id      UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  reply_id     UUID REFERENCES post_replies(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'support',  -- 'support', 'hear_you', 'keep_going'
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR
    (post_id IS NULL AND reply_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, reply_id)
);

CREATE TABLE content_reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id      UUID REFERENCES community_posts(id),
  reply_id     UUID REFERENCES post_replies(id),
  reason       TEXT NOT NULL,
  details      TEXT,
  status       report_status DEFAULT 'pending',
  reviewed_by  UUID REFERENCES users(id),
  reviewed_at  TIMESTAMPTZ,
  action_taken moderation_action,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_moderation (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action       moderation_action NOT NULL,
  reason       TEXT NOT NULL,
  moderator_id UUID REFERENCES users(id),
  expires_at   TIMESTAMPTZ,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DAILY FEED
-- ============================================================

CREATE TABLE feed_content (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type   TEXT NOT NULL,  -- 'morning_message', 'reflection', 'exercise', 'reach_out', 'victory'
  title          TEXT,
  body           TEXT NOT NULL,
  struggle_tags  struggle_category[],
  mood_range_min INTEGER DEFAULT 1,
  mood_range_max INTEGER DEFAULT 10,
  is_premium     BOOLEAN DEFAULT FALSE,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_feed_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id     UUID NOT NULL REFERENCES feed_content(id),
  shown_at       TIMESTAMPTZ DEFAULT NOW(),
  was_opened     BOOLEAN DEFAULT FALSE,
  was_completed  BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- CRISIS EVENTS
-- ============================================================

CREATE TABLE crisis_events (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  severity              crisis_severity NOT NULL,
  trigger_source        TEXT NOT NULL,  -- 'chatbot', 'community', 'mood', 'sos'
  trigger_content_hash  TEXT,  -- hash of content that triggered (not plaintext)
  crisis_resource_shown UUID REFERENCES crisis_resources(id),
  hotline_call_initiated BOOLEAN DEFAULT FALSE,
  emergency_contact_notified BOOLEAN DEFAULT FALSE,
  user_dismissed        BOOLEAN DEFAULT FALSE,
  follow_up_scheduled   TIMESTAMPTZ,
  follow_up_completed   BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  resolved_at           TIMESTAMPTZ
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notification_queue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB,
  scheduled_for   TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  retry_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BILLING
-- ============================================================

CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  tier                subscription_tier DEFAULT 'free',
  status              TEXT DEFAULT 'active',
  trial_ends_at       TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS (privacy-first, aggregated only)
-- ============================================================

CREATE TABLE daily_aggregates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date            DATE NOT NULL,
  metric_key      TEXT NOT NULL,
  metric_value    FLOAT NOT NULL,
  dimension       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, metric_key, dimension)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);

-- Conversations
CREATE INDEX idx_conversations_user_date ON conversations(user_id, session_date DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_user ON messages(user_id, created_at DESC);

-- Mood
CREATE INDEX idx_mood_entries_user_time ON mood_entries(user_id, recorded_at DESC);

-- Goals
CREATE INDEX idx_user_goals_user ON user_goals(user_id, is_active);
CREATE INDEX idx_goal_completions_user ON goal_completions(user_id, completed_at DESC);

-- Community
CREATE INDEX idx_community_posts_group ON community_posts(group_id, created_at DESC)
  WHERE is_removed = FALSE;
CREATE INDEX idx_community_posts_user ON community_posts(user_id, created_at DESC);
CREATE INDEX idx_post_replies_post ON post_replies(post_id, created_at)
  WHERE is_removed = FALSE;
CREATE INDEX idx_group_memberships_user ON group_memberships(user_id);

-- Crisis
CREATE INDEX idx_crisis_events_user ON crisis_events(user_id, created_at DESC);
CREATE INDEX idx_crisis_events_severity ON crisis_events(severity, created_at DESC);

-- Feed
CREATE INDEX idx_user_feed_history_user ON user_feed_history(user_id, shown_at DESC);

-- Notifications
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for)
  WHERE sent_at IS NULL AND failed_at IS NULL;

-- Full-text search on community posts
CREATE INDEX idx_community_posts_fts ON community_posts
  USING GIN (to_tsvector('english', content));

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_goals_updated_at
  BEFORE UPDATE ON user_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_groups SET member_count = member_count + 1
    WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_groups SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_group_member_count
  AFTER INSERT OR DELETE ON group_memberships
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default milestone definitions
INSERT INTO milestones (key, title, description, icon, xp_reward) VALUES
  ('first_checkin', 'First Step', 'Completed your first check-in', '🌱', 25),
  ('streak_3', '3-Day Streak', 'Checked in 3 days in a row', '🔥', 50),
  ('streak_7', 'Week Warrior', 'Checked in 7 days in a row', '⭐', 100),
  ('streak_30', 'Monthly Champion', '30 consecutive days', '🏆', 300),
  ('first_goal', 'Goal Setter', 'Completed your first goal', '🎯', 50),
  ('community_first', 'Not Alone', 'Posted in the community for the first time', '🤝', 50),
  ('mood_improver', 'Rising Up', 'Average mood improved over 7 days', '📈', 75),
  ('crisis_survived', 'Resilient', 'Reached out for help when you needed it', '💙', 100);

-- Default goal templates
INSERT INTO goal_templates (category, title, description, level, duration_minutes, xp_reward) VALUES
  -- Smoking
  ('smoking', 'Delay First Cigarette', 'Wait 15 extra minutes before your first cigarette', 1, 15, 10),
  ('smoking', 'Reduce by One', 'Have one fewer cigarette than yesterday', 2, NULL, 15),
  ('smoking', 'One Smoke-Free Hour', 'Go one full hour without smoking', 2, 60, 20),
  ('smoking', 'Smoke-Free Morning', 'No cigarettes until after lunch', 3, 240, 30),
  ('smoking', 'Smoke-Free Day', 'No cigarettes for the entire day', 5, 1440, 100),
  -- Exercise
  ('exercise', '5-Minute Walk', 'Walk outside for just 5 minutes', 1, 5, 10),
  ('exercise', '3-Minute Stretch', 'Stretch your body for 3 minutes', 1, 3, 10),
  ('exercise', '10-Minute Walk', 'A 10-minute walk outdoors', 2, 10, 15),
  ('exercise', '15-Minute Walk', 'Extend your walk to 15 minutes', 3, 15, 20),
  ('exercise', '30-Minute Activity', '30 minutes of any physical activity', 5, 30, 50),
  -- Social
  ('social', 'Send One Text', 'Text one friend or family member', 1, NULL, 10),
  ('social', '5-Minute Call', 'Make a 5-minute phone call to someone', 2, 5, 20),
  ('social', 'Make Plans', 'Arrange to meet someone in person', 3, NULL, 30),
  ('social', 'Attend Activity', 'Go to one social activity or event', 4, NULL, 40),
  -- Mental Wellbeing
  ('mental_wellbeing', 'Journal 2 Minutes', 'Write freely in a journal for 2 minutes', 1, 2, 10),
  ('mental_wellbeing', 'Gratitude Note', 'Write down one thing you are grateful for', 1, 2, 10),
  ('mental_wellbeing', 'Name an Emotion', 'Identify and name one emotion you felt today', 1, NULL, 10),
  ('mental_wellbeing', '5-Minute Meditation', 'Sit quietly and breathe for 5 minutes', 2, 5, 20),
  ('mental_wellbeing', 'Share Your Feelings', 'Tell someone honestly how you are feeling', 3, NULL, 30);

-- Default community groups
INSERT INTO community_groups (slug, name, description, icon, category) VALUES
  ('breakup-recovery', 'Breakup Recovery', 'Support for men going through separation and heartbreak', '💔', 'relationship'),
  ('fathers-under-stress', 'Fathers Under Stress', 'For dads navigating the pressures of fatherhood', '👨‍👧', 'family'),
  ('financial-recovery', 'Financial Recovery', 'Rebuilding after financial setbacks', '💰', 'financial'),
  ('smoking-cessation', 'Quit Smoking Together', 'Support each other through the quit journey', '🚭', 'addiction'),
  ('career-setbacks', 'Career Setbacks', 'Navigating job loss, career changes, and workplace stress', '💼', 'career'),
  ('loneliness-support', 'Loneliness Support', 'You are not alone — connect with others who understand', '🤝', 'loneliness'),
  ('anxiety-support', 'Anxiety Support', 'Managing anxiety and worry day by day', '🌊', 'health'),
  ('grief-loss', 'Grief & Loss', 'Processing loss of any kind', '🕊️', 'health'),
  ('addiction-recovery', 'Addiction Recovery', 'All addictions — support without judgment', '🌱', 'addiction');
```

---

## Entity Relationship Summary

```
users
  ├── user_profiles (1:1)
  ├── user_sessions (1:N)
  ├── emergency_contacts (1:N)
  ├── conversations (1:N)
  │   └── messages (1:N)
  ├── mood_entries (1:N)
  ├── user_goals (1:N)
  │   └── goal_completions (1:N)
  ├── group_memberships (N:M via community_groups)
  ├── community_posts (1:N)
  │   └── post_replies (1:N)
  ├── crisis_events (1:N)
  ├── subscriptions (1:1)
  └── user_xp (1:1)

countries
  └── crisis_resources (1:N)

community_groups
  ├── group_memberships (1:N)
  └── community_posts (1:N)

goal_templates
  └── user_goals (1:N)

milestones
  └── user_milestones (N:M via users)
```
