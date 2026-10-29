-- ============================================================
-- WanderLens — Full Database Schema
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)
-- or via supabase db push if using the CLI.
--
-- Prerequisites (already enabled on Supabase):
--   CREATE EXTENSION IF NOT EXISTS postgis;
--   CREATE EXTENSION IF NOT EXISTS vector;
--   CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Enums ──────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('traveller', 'moderator', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE group_status AS ENUM ('active', 'ended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE group_member_status AS ENUM ('invited', 'accepted', 'left');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE image_kind AS ENUM ('reference', 'historic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('need_help', 'regroup', 'custom_message');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sos_status AS ENUM ('active', 'resolved', 'false_alarm');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_target_type AS ENUM ('post', 'comment', 'message', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('open', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE place_category AS ENUM ('heritage', 'food', 'nature', 'viewpoint', 'market', 'culture', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Helper: updated_at trigger ─────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── Profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  role          user_role NOT NULL DEFAULT 'traveller',
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  sos_opt_in    BOOLEAN NOT NULL DEFAULT FALSE,
  suspended_until TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Sync email verification status
CREATE OR REPLACE FUNCTION handle_user_updated()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE profiles SET is_verified = TRUE, updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_user_updated();

-- ─── Audit log ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  target_type   TEXT,
  target_id     TEXT,
  meta          JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to write audit entries from triggers / RPCs
CREATE OR REPLACE FUNCTION write_audit(
  p_actor_id    UUID,
  p_action      TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id   TEXT DEFAULT NULL,
  p_meta        JSONB DEFAULT '{}'
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO audit_log (actor_id, action, target_type, target_id, meta)
  VALUES (p_actor_id, p_action, p_target_type, p_target_id, p_meta);
END;
$$;

-- ─── Role change logging ────────────────────────────────────
CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_log (actor_id, action, target_type, target_id, meta)
    VALUES (
      auth.uid(),
      'role_changed',
      'profile',
      NEW.id::TEXT,
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_role_change_log
  AFTER UPDATE OF role ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_role_change();

-- ─── Destinations ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS destinations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  region      TEXT NOT NULL,
  country     TEXT NOT NULL DEFAULT 'India',
  centre      GEOGRAPHY(POINT, 4326) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER destinations_updated_at
  BEFORE UPDATE ON destinations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Places ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS places (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        place_category NOT NULL DEFAULT 'other',
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  description     TEXT,
  avg_rating      NUMERIC(3,2) NOT NULL DEFAULT 0,
  n_ratings       INT NOT NULL DEFAULT 0,
  is_seeded       BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER places_updated_at
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS places_destination_idx ON places(destination_id);
CREATE INDEX IF NOT EXISTS places_location_idx ON places USING GIST(location);

-- ─── Place Activity Daily ───────────────────────────────────
CREATE TABLE IF NOT EXISTS place_activity_daily (
  place_id    UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  posts       INT NOT NULL DEFAULT 0,
  checkins    INT NOT NULL DEFAULT 0,
  likes       INT NOT NULL DEFAULT 0,
  comments    INT NOT NULL DEFAULT 0,
  PRIMARY KEY (place_id, date)
);

-- ─── Monuments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monuments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id   UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  location         GEOGRAPHY(POINT, 4326) NOT NULL,
  built_year       INT,
  builder          TEXT,
  style            TEXT,
  history_text     TEXT NOT NULL DEFAULT '',
  history_version  INT NOT NULL DEFAULT 1,
  is_published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER monuments_updated_at
  BEFORE UPDATE ON monuments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS monuments_destination_idx ON monuments(destination_id);
CREATE INDEX IF NOT EXISTS monuments_location_idx ON monuments USING GIST(location);

-- ─── Monument Images ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monument_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monument_id   UUID NOT NULL REFERENCES monuments(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  kind          image_kind NOT NULL,
  source_url    TEXT,
  license       TEXT,
  author_credit TEXT,
  embedding     vector(512),  -- only for reference images
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS monument_images_monument_idx ON monument_images(monument_id);
CREATE INDEX IF NOT EXISTS monument_images_embedding_idx ON monument_images
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

-- ─── Monument Revisions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS monument_revisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monument_id  UUID NOT NULL REFERENCES monuments(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  edited_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Scans ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  monument_id  UUID REFERENCES monuments(id) ON DELETE SET NULL,
  confidence   NUMERIC(4,3),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Posts ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  place_id   UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  caption    TEXT CHECK (char_length(caption) <= 500),
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  is_hidden  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS posts_place_idx ON posts(place_id);
CREATE INDEX IF NOT EXISTS posts_user_idx ON posts(user_id);

-- ─── Post Images ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Post Likes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ─── Comments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body       TEXT NOT NULL CHECK (char_length(body) <= 1000),
  is_hidden  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Communities ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS communities (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  owner_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'owner')),
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

-- ─── Messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body         TEXT NOT NULL CHECK (char_length(body) <= 2000),
  is_hidden    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_community_idx ON messages(community_id, created_at DESC);

-- ─── Travel Groups ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS travel_groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id   UUID REFERENCES communities(id) ON DELETE SET NULL,
  owner_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  starts_at      TIMESTAMPTZ NOT NULL,
  ends_at        TIMESTAMPTZ NOT NULL,
  status         group_status NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE OR REPLACE TRIGGER travel_groups_updated_at
  BEFORE UPDATE ON travel_groups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Group Members ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_members (
  group_id   UUID NOT NULL REFERENCES travel_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status     group_member_status NOT NULL DEFAULT 'invited',
  sharing_on BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- ─── Group Locations ────────────────────────────────────────
-- Stores only the LATEST location per member (upsert pattern).
CREATE TABLE IF NOT EXISTS group_locations (
  group_id   UUID NOT NULL REFERENCES travel_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location   GEOGRAPHY(POINT, 4326) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- ─── Group Alerts ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_alerts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES travel_groups(id) ON DELETE CASCADE,
  from_user  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type       alert_type NOT NULL,
  body       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── User Presence (SOS opt-in) ─────────────────────────────
CREATE TABLE IF NOT EXISTS user_presence (
  user_id          UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  coarse_location  GEOGRAPHY(POINT, 4326) NOT NULL,
  expires_at       TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS user_presence_location_idx ON user_presence USING GIST(coarse_location);
CREATE INDEX IF NOT EXISTS user_presence_expires_idx ON user_presence(expires_at);

-- ─── SOS Alerts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sos_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coarse_location  GEOGRAPHY(POINT, 4326) NOT NULL,
  note             TEXT CHECK (char_length(note) <= 200),
  status           sos_status NOT NULL DEFAULT 'active',
  recipient_count  INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sos_responses (
  sos_id       UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  helper_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  responded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (sos_id, helper_id)
);

-- ─── Blocks ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

-- ─── Reports ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type  report_target_type NOT NULL,
  target_id    UUID NOT NULL,
  reason       TEXT NOT NULL CHECK (char_length(reason) <= 500),
  status       report_status NOT NULL DEFAULT 'open',
  handled_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  outcome      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status, created_at DESC);

-- ─── Recommendation view (materialised-ish via function) ────
-- Called by GET /api/destinations/:id/recommendations
CREATE OR REPLACE FUNCTION get_recommendations(
  p_destination_id UUID,
  p_category       place_category DEFAULT NULL,
  p_sort           TEXT DEFAULT 'hidden_gems'
)
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  category     place_category,
  avg_rating   NUMERIC,
  n_ratings    INT,
  is_seeded    BOOLEAN,
  description  TEXT,
  score        NUMERIC,
  activity_raw NUMERIC,
  confidence   NUMERIC,
  distance_m   NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  K CONSTANT NUMERIC := 5;
  W CONSTANT NUMERIC := 0.5;
  MIN_RATING CONSTANT NUMERIC := 3.8;
  MIN_N CONSTANT INT := 3;
BEGIN
  RETURN QUERY
  WITH activity AS (
    SELECT
      pad.place_id,
      SUM(pad.posts)    + 2 * SUM(pad.checkins)
        + SUM(pad.likes) * 0.2 + SUM(pad.comments) * 0.5 AS activity_raw
    FROM place_activity_daily pad
    WHERE pad.date >= CURRENT_DATE - 30
    GROUP BY pad.place_id
  ),
  ranked AS (
    SELECT
      p.id,
      p.name,
      p.category,
      p.avg_rating,
      p.n_ratings,
      p.is_seeded,
      p.description,
      COALESCE(a.activity_raw, 0) AS activity_raw,
      p.n_ratings::NUMERIC / (p.n_ratings + K) AS conf,
      PERCENT_RANK() OVER (ORDER BY COALESCE(a.activity_raw, 0)) AS activity_norm
    FROM places p
    LEFT JOIN activity a ON a.place_id = p.id
    WHERE p.destination_id = p_destination_id
      AND p.is_hidden = FALSE
      AND (p_category IS NULL OR p.category = p_category)
      AND p.avg_rating >= MIN_RATING
      AND p.n_ratings >= MIN_N
  ),
  eligible AS (
    SELECT *,
      (avg_rating / 5.0) * conf - W * activity_norm AS score
    FROM ranked
    WHERE activity_norm <= 0.5
  )
  SELECT
    e.id, e.name, e.category,
    e.avg_rating, e.n_ratings, e.is_seeded,
    e.description,
    e.score::NUMERIC(6,4),
    e.activity_raw::NUMERIC(10,2),
    e.conf::NUMERIC(4,3),
    NULL::NUMERIC AS distance_m
  FROM eligible e
  ORDER BY
    CASE WHEN p_sort = 'hidden_gems' THEN e.score END DESC,
    CASE WHEN p_sort = 'top_rated'   THEN e.avg_rating END DESC,
    CASE WHEN p_sort = 'nearest'     THEN e.score END DESC  -- distance added by client
  LIMIT 50;
END;
$$;

-- ─── SOS rate-limit check function ─────────────────────────
CREATE OR REPLACE FUNCTION check_sos_rate_limit(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  recent_count INT;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM sos_alerts
  WHERE sender_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
  RETURN recent_count < 3;
END;
$$;

-- ─── Purge expired presence ─────────────────────────────────
CREATE OR REPLACE FUNCTION purge_expired_presence()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM user_presence WHERE expires_at < NOW();
END;
$$;
