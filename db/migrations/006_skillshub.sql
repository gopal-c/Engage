-- SkillsHub schema migration for Engage
-- Profiles + milestones under skillshub.* schema
-- Auth handled by auth.users (Google OAuth) — no separate users table needed

CREATE SCHEMA IF NOT EXISTS skillshub;

-- Profiles table — employee skill profiles
-- user_id links to auth.users for employees who have logged in via Google OAuth
-- email is the primary lookup key for mapping
CREATE TABLE IF NOT EXISTS skillshub.profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  name          TEXT,
  email         TEXT,
  city          TEXT,
  seniority     TEXT CHECK (seniority IN ('junior', 'mid', 'senior', 'lead')),
  years_experience INT DEFAULT 0,
  skills        JSONB DEFAULT '[]'::jsonb,
  projects      JSONB DEFAULT '[]'::jsonb,
  education     JSONB DEFAULT '[]'::jsonb,
  avatar_url    TEXT,
  joining_date  DATE,
  date_of_birth DATE,
  work_email              TEXT,
  work_email_verified     BOOLEAN NOT NULL DEFAULT FALSE,
  work_email_verification_token TEXT,
  work_email_verification_expires_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS skillshub_profiles_work_email_key
  ON skillshub.profiles (work_email) WHERE work_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_skillshub_profiles_email
  ON skillshub.profiles (lower(email));

CREATE INDEX IF NOT EXISTS idx_skillshub_profiles_user_id
  ON skillshub.profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_skillshub_profiles_status
  ON skillshub.profiles (status);

-- Milestones table — achievements, promotions, certifications, etc.
CREATE TABLE IF NOT EXISTS skillshub.milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES skillshub.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  milestone_date DATE NOT NULL,
  category      TEXT NOT NULL DEFAULT 'achievement'
                  CHECK (category IN ('achievement', 'promotion', 'certification', 'education', 'milestone', 'celebration', 'other')),
  created_by    TEXT NOT NULL CHECK (created_by IN ('hr', 'employee')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skillshub_milestones_profile_id
  ON skillshub.milestones (profile_id);

-- Seed default data: 15 demo employee profiles from original SkillsHub
-- This is done via the /api/skillshub/init endpoint, not in migration SQL,
-- because it needs the seed JSON file and programmatic logic.
