-- ProjectsHub schema for Engage
-- Project management, skill-based team building, and project communication channels

CREATE SCHEMA IF NOT EXISTS projectshub;

CREATE TABLE projectshub.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'archived')),
  department TEXT,
  required_skills TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projectshub.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projectshub.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('lead', 'member', 'reviewer')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE TABLE projectshub.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projectshub.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projectshub.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projectshub.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE projectshub.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES projectshub.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  parent_id UUID REFERENCES projectshub.messages(id),
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projectshub_messages_channel ON projectshub.messages(channel_id, created_at);
CREATE INDEX idx_projectshub_members_user ON projectshub.project_members(user_id);
CREATE INDEX idx_projectshub_members_project ON projectshub.project_members(project_id);
CREATE INDEX idx_projectshub_milestones_project ON projectshub.project_milestones(project_id);
CREATE INDEX idx_projectshub_channels_project ON projectshub.channels(project_id);

-- Add new feed event types for project events
ALTER TABLE engage.feed_events DROP CONSTRAINT IF EXISTS feed_events_event_type_check;
ALTER TABLE engage.feed_events ADD CONSTRAINT feed_events_event_type_check
  CHECK (event_type IN (
    'new_joiner', 'birthday_today', 'birthday_upcoming', 'idea_shared',
    'certification', 'work_anniversary', 'milestone', 'achievement',
    'project_launched', 'project_assigned', 'project_completed', 'project_milestone_completed'
  ));
