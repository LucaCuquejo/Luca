-- InnerBrother Initial Schema Migration
-- Run with: psql $DATABASE_URL -f migrations/001_initial_schema.sql

BEGIN;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ENUMS
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
CREATE TYPE crisis_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'actioned', 'dismissed');
CREATE TYPE moderation_action AS ENUM ('warning', 'temp_ban', 'perm_ban', 'content_removed');

-- USERS & AUTH
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

CREATE TABLE user_profiles (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username              TEXT UNIQUE NOT NULL,
  display_name          TEXT,
  country_code          TEXT NOT NULL DEFAULT 'US',
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
  phone        TEXT NOT NULL,
  relationship TEXT,
  notify_on_crisis BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- COUNTRIES & CRISIS RESOURCES
CREATE TABLE countries (
  code         TEXT PRIMARY KEY,
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

-- CONVERSATIONS & MESSAGES
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
  content         TEXT NOT NULL,
  crisis_score    FLOAT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_context_summaries (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary      TEXT NOT NULL,
  struggles    struggle_category[],
  key_themes   TEXT[],
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- MOOD
CREATE TABLE mood_entries (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score         INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  stress_level  INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  energy_level  INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  anxiety_level INTEGER CHECK (anxiety_level BETWEEN 1 AND 10),
  note          TEXT,
  source        TEXT DEFAULT 'manual',
  recorded_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- GOALS
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

-- XP & MILESTONES
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

-- COMMUNITY
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

-- CRISIS EVENTS
CREATE TABLE crisis_events (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  severity              crisis_severity NOT NULL,
  trigger_source        TEXT NOT NULL,
  trigger_content_hash  TEXT,
  crisis_resource_shown UUID REFERENCES crisis_resources(id),
  hotline_call_initiated BOOLEAN DEFAULT FALSE,
  emergency_contact_notified BOOLEAN DEFAULT FALSE,
  user_dismissed        BOOLEAN DEFAULT FALSE,
  follow_up_scheduled   TIMESTAMPTZ,
  follow_up_completed   BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  resolved_at           TIMESTAMPTZ
);

-- FEED
CREATE TABLE feed_content (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type   TEXT NOT NULL,
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

-- NOTIFICATIONS
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

-- INDEXES
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_conversations_user_date ON conversations(user_id, session_date DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_mood_entries_user_time ON mood_entries(user_id, recorded_at DESC);
CREATE INDEX idx_user_goals_user ON user_goals(user_id, is_active);
CREATE INDEX idx_goal_completions_user ON goal_completions(user_id, completed_at DESC);
CREATE INDEX idx_community_posts_group ON community_posts(group_id, created_at DESC) WHERE is_removed = FALSE;
CREATE INDEX idx_crisis_events_user ON crisis_events(user_id, created_at DESC);
CREATE INDEX idx_notification_queue_scheduled ON notification_queue(scheduled_for) WHERE sent_at IS NULL AND failed_at IS NULL;

-- AUTO-UPDATE TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_goals_updated_at BEFORE UPDATE ON user_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_community_posts_updated_at BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- SEED: Countries
INSERT INTO countries (code, name, flag_emoji) VALUES
  ('US', 'United States', '🇺🇸'), ('GB', 'United Kingdom', '🇬🇧'),
  ('AU', 'Australia', '🇦🇺'), ('CA', 'Canada', '🇨🇦'),
  ('IE', 'Ireland', '🇮🇪'), ('NZ', 'New Zealand', '🇳🇿'),
  ('ZA', 'South Africa', '🇿🇦'), ('DE', 'Germany', '🇩🇪'),
  ('FR', 'France', '🇫🇷'), ('ES', 'Spain', '🇪🇸'),
  ('IT', 'Italy', '🇮🇹'), ('BR', 'Brazil', '🇧🇷'),
  ('MX', 'Mexico', '🇲🇽'), ('IN', 'India', '🇮🇳'),
  ('JP', 'Japan', '🇯🇵');

-- SEED: Crisis Resources
INSERT INTO crisis_resources (country_code, organization, hotline_number, hotline_display, website_url, available_hours, is_primary) VALUES
  ('US', '988 Suicide & Crisis Lifeline', '988', '988', 'https://988lifeline.org', '24/7', true),
  ('GB', 'Samaritans', '116123', '116 123', 'https://samaritans.org', '24/7', true),
  ('AU', 'Lifeline', '131114', '13 11 14', 'https://lifeline.org.au', '24/7', true),
  ('CA', 'Crisis Services Canada', '18334564566', '1-833-456-4566', 'https://crisisservicescanada.ca', '24/7', true),
  ('IE', 'Samaritans', '116123', '116 123', 'https://samaritans.org/ireland', '24/7', true),
  ('NZ', 'Lifeline', '0800543354', '0800 543 354', 'https://lifeline.org.nz', '24/7', true),
  ('ZA', 'SADAG', '0800456789', '0800 456 789', 'https://sadag.org', '24/7', true),
  ('DE', 'TelefonSeelsorge', '08001110111', '0800 111 0 111', 'https://telefonseelsorge.de', '24/7', true),
  ('FR', 'Numéro national prévention suicide', '3114', '3114', 'https://3114.fr', '24/7', true),
  ('ES', 'Teléfono de la Esperanza', '717003717', '717 003 717', null, '24/7', true),
  ('IT', 'Telefono Amico', '0223272327', '02 2327 2327', null, 'Business hours', true),
  ('BR', 'CVV', '188', '188', 'https://cvv.org.br', '24/7', true),
  ('MX', 'SAPTEL', '5552598121', '55 5259-8121', null, '24/7', true),
  ('IN', 'iCall', '9152987821', '9152987821', 'https://icallhelpline.org', 'Mon-Sat 8am-10pm', true),
  ('JP', 'Inochi no Denwa', '0570783556', '0570-783-556', null, '24/7', true);

-- SEED: Milestones
INSERT INTO milestones (key, title, description, icon, xp_reward) VALUES
  ('first_checkin', 'First Step', 'Completed your first check-in', '🌱', 25),
  ('streak_3', '3-Day Streak', 'Checked in 3 days in a row', '🔥', 50),
  ('streak_7', 'Week Warrior', 'Checked in 7 days in a row', '⭐', 100),
  ('streak_30', 'Monthly Champion', '30 consecutive days', '🏆', 300),
  ('first_goal', 'Goal Setter', 'Completed your first goal', '🎯', 50),
  ('community_first', 'Not Alone', 'Posted in the community for the first time', '🤝', 50),
  ('mood_improver', 'Rising Up', 'Average mood improved over 7 days', '📈', 75);

-- SEED: Goal Templates
INSERT INTO goal_templates (category, title, description, level, duration_minutes, xp_reward) VALUES
  ('smoking', 'Delay First Cigarette', 'Wait 15 extra minutes before your first cigarette', 1, 15, 10),
  ('smoking', 'Reduce by One', 'Have one fewer cigarette than yesterday', 2, null, 15),
  ('smoking', 'One Smoke-Free Hour', 'Go one full hour without smoking', 2, 60, 20),
  ('smoking', 'Smoke-Free Morning', 'No cigarettes until after lunch', 3, 240, 30),
  ('smoking', 'Smoke-Free Day', 'No cigarettes for the entire day', 5, 1440, 100),
  ('exercise', '5-Minute Walk', 'Walk outside for just 5 minutes', 1, 5, 10),
  ('exercise', '3-Minute Stretch', 'Stretch your body for 3 minutes', 1, 3, 10),
  ('exercise', '10-Minute Walk', 'A 10-minute walk outdoors', 2, 10, 15),
  ('exercise', '15-Minute Walk', 'Extend your walk to 15 minutes', 3, 15, 20),
  ('exercise', '30-Minute Activity', '30 minutes of any physical activity', 5, 30, 50),
  ('social', 'Send One Text', 'Text one friend or family member', 1, null, 10),
  ('social', '5-Minute Call', 'Make a 5-minute phone call to someone', 2, 5, 20),
  ('social', 'Make Plans', 'Arrange to meet someone in person', 3, null, 30),
  ('social', 'Attend Activity', 'Go to one social activity or event', 4, null, 40),
  ('mental_wellbeing', 'Journal 2 Minutes', 'Write freely in a journal for 2 minutes', 1, 2, 10),
  ('mental_wellbeing', 'Gratitude Note', 'Write down one thing you are grateful for', 1, 2, 10),
  ('mental_wellbeing', 'Name an Emotion', 'Identify and name one emotion you felt today', 1, null, 10),
  ('mental_wellbeing', '5-Minute Meditation', 'Sit quietly and breathe for 5 minutes', 2, 5, 20),
  ('mental_wellbeing', 'Share Your Feelings', 'Tell someone honestly how you are feeling', 3, null, 30);

-- SEED: Community Groups
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

COMMIT;
