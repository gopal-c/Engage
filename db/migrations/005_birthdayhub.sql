CREATE SCHEMA IF NOT EXISTS birthdayhub;

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

CREATE TABLE IF NOT EXISTS birthdayhub.settings (
  id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key    TEXT NOT NULL UNIQUE,
  value  JSONB NOT NULL DEFAULT '{}'
);

-- Seed default settings
INSERT INTO birthdayhub.settings (key, value) VALUES
  ('from_name', '"BirthdayHub"'),
  ('auto_send', 'true'),
  ('cc_list', '[]'),
  ('bcc_list', '[]'),
  ('cron_time', '"09:00"')
ON CONFLICT (key) DO NOTHING;
