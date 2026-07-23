-- Add profile completion fields to auth.users for onboarding flow
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT false;
