-- Rename user_preferences to about_me
ALTER TABLE IF EXISTS birthdayhub.user_preferences RENAME TO about_me;

-- Rename index
ALTER INDEX IF EXISTS birthdayhub.idx_user_preferences_user RENAME TO idx_about_me_user;

-- Migrate existing bio data from auth.users into birthdayhub.about_me
INSERT INTO birthdayhub.about_me (user_id, about_me, updated_at)
SELECT id, bio, NOW()
FROM auth.users
WHERE bio IS NOT NULL AND bio != ''
  AND id NOT IN (SELECT user_id FROM birthdayhub.about_me)
ON CONFLICT (user_id) DO UPDATE SET
  about_me = COALESCE(birthdayhub.about_me.about_me, EXCLUDED.about_me),
  updated_at = NOW();

-- Drop bio and profile_completed from auth.users
ALTER TABLE auth.users DROP COLUMN IF EXISTS bio;
ALTER TABLE auth.users DROP COLUMN IF EXISTS profile_completed;
