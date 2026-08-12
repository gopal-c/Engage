CREATE TABLE IF NOT EXISTS birthdayhub.user_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  hobbies           TEXT[] DEFAULT '{}',
  favorite_drinks   TEXT[] DEFAULT '{}',
  food_preference   TEXT,
  interests         TEXT[] DEFAULT '{}',
  celebration_style TEXT,
  about_me          TEXT,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON birthdayhub.user_preferences(user_id);
