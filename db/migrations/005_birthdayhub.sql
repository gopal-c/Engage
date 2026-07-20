CREATE SCHEMA IF NOT EXISTS birthdayhub;

-- Employees
CREATE TABLE IF NOT EXISTS birthdayhub.employees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  department  TEXT,
  birthday    TEXT NOT NULL,  -- MM-DD format
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bh_employees_birthday ON birthdayhub.employees(birthday);
CREATE INDEX IF NOT EXISTS idx_bh_employees_user ON birthdayhub.employees(user_id);

-- Send logs
CREATE TABLE IF NOT EXISTS birthdayhub.send_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id    UUID NOT NULL REFERENCES birthdayhub.employees(id) ON DELETE CASCADE,
  employee_name  TEXT NOT NULL,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  year           INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'sent',
  error          TEXT
);

CREATE INDEX IF NOT EXISTS idx_bh_send_logs_employee ON birthdayhub.send_logs(employee_id, year DESC);
CREATE INDEX IF NOT EXISTS idx_bh_send_logs_year ON birthdayhub.send_logs(year, sent_at DESC);

-- Scheduled sends
CREATE TABLE IF NOT EXISTS birthdayhub.scheduled_sends (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id        UUID NOT NULL REFERENCES birthdayhub.employees(id) ON DELETE CASCADE,
  employee_name      TEXT NOT NULL,
  employee_email     TEXT NOT NULL,
  message            TEXT,
  gmail_user         TEXT,
  gmail_app_password TEXT,
  from_name          TEXT DEFAULT 'The HR Team',
  cc                 JSONB DEFAULT '[]',
  cc_behavior        TEXT DEFAULT 'cc',
  mood               TEXT DEFAULT 'Sunny',
  fuel               TEXT DEFAULT 'Coffee',
  hero_image_url     TEXT,
  palette_id         TEXT,
  scheduled_at       TIMESTAMPTZ NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bh_scheduled_status ON birthdayhub.scheduled_sends(status, scheduled_at);

-- Key-value store (for app settings)
CREATE TABLE IF NOT EXISTS birthdayhub.kv_store (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'
);

-- Seed default settings
INSERT INTO birthdayhub.kv_store (key, value) VALUES
  ('bh:settings', '{
    "fromName": "The HR Team",
    "replyTo": "",
    "autoSendEnabled": true,
    "sendTimeIST": "09:00",
    "sendTimeUTC": "03:30",
    "cronExpression": "30 3 * * *",
    "ccMode": "all",
    "customCCList": [],
    "bccOverride": true
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
