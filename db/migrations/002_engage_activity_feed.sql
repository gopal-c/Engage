CREATE SCHEMA IF NOT EXISTS engage;

CREATE TABLE IF NOT EXISTS engage.activity_feed (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  source_app  TEXT NOT NULL CHECK (source_app IN ('ideahub', 'skillshub', 'birthdayhub', 'engage')),
  event_type  TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON engage.activity_feed(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_source ON engage.activity_feed(source_app, created_at DESC);
