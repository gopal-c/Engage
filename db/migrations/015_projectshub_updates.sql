-- Unread tracking per channel per user
CREATE TABLE IF NOT EXISTS projectshub.channel_reads (
  channel_id UUID REFERENCES projectshub.channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

-- Join requests
CREATE TABLE IF NOT EXISTS projectshub.join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projectshub.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);
