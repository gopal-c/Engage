-- Unified feed events
CREATE TABLE engage.feed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('new_joiner', 'birthday_today', 'birthday_upcoming', 'idea_shared', 'certification', 'work_anniversary', 'milestone', 'achievement')),
  source_app TEXT NOT NULL CHECK (source_app IN ('ideahub', 'skillshub', 'birthdayhub', 'engage')),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  pinned BOOLEAN DEFAULT false,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_feed_events_date ON engage.feed_events(event_date DESC, created_at DESC);

-- Unified reactions
CREATE TABLE engage.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_event_id UUID NOT NULL REFERENCES engage.feed_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'celebrate')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feed_event_id, user_id, reaction_type)
);

-- Comments on feed cards
CREATE TABLE engage.feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_event_id UUID NOT NULL REFERENCES engage.feed_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_feed_comments_event ON engage.feed_comments(feed_event_id, created_at);

-- Group birthday cards
CREATE TABLE birthdayhub.group_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  birthday_user_id UUID NOT NULL REFERENCES auth.users(id),
  event_date DATE NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'delivered')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(birthday_user_id, event_date)
);

-- Signatures on group cards
CREATE TABLE birthdayhub.card_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES birthdayhub.group_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(card_id, user_id)
);

-- XP events
CREATE TABLE engage.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_app TEXT NOT NULL,
  action TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_xp_events_user ON engage.xp_events(user_id, created_at DESC);

-- User levels
CREATE TABLE engage.user_levels (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User badges
CREATE TABLE engage.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_icon TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
