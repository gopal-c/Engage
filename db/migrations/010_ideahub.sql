CREATE SCHEMA IF NOT EXISTS ideahub;

CREATE TABLE IF NOT EXISTS ideahub.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideahub.ideas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  category_id       UUID REFERENCES ideahub.categories(id),
  author_id         UUID NOT NULL REFERENCES auth.users(id),
  is_anonymous      BOOLEAN DEFAULT true,
  status            TEXT DEFAULT 'open' CHECK (status IN ('open','under_review','approved','implemented','declined')),
  ai_enrichment     JSONB,
  impact_score      REAL,
  feasibility_score REAL,
  trending_score    REAL DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideahub.votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id    UUID NOT NULL REFERENCES ideahub.ideas(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  vote_type  TEXT NOT NULL CHECK (vote_type IN ('up','down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

CREATE TABLE IF NOT EXISTS ideahub.comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id      UUID NOT NULL REFERENCES ideahub.ideas(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  body         TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  parent_id    UUID REFERENCES ideahub.comments(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ideahub.comment_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES ideahub.comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  emoji      TEXT NOT NULL,
  UNIQUE(comment_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS ideahub.bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id    UUID NOT NULL REFERENCES ideahub.ideas(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(idea_id, user_id)
);

CREATE TABLE IF NOT EXISTS ideahub.badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideahub.ideas(category_id);
CREATE INDEX IF NOT EXISTS idx_ideas_author ON ideahub.ideas(author_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideahub.ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_trending ON ideahub.ideas(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_created ON ideahub.ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_idea ON ideahub.votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_idea ON ideahub.comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON ideahub.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_user ON ideahub.badges(user_id);

-- Seed default categories
INSERT INTO ideahub.categories (name, description, icon) VALUES
  ('Cost Saving',         'Ideas to reduce costs and improve efficiency',       '💰'),
  ('Culture',             'Workplace culture and team building ideas',          '🎭'),
  ('Facilities',          'Office space, amenities, and workplace environment', '🏢'),
  ('Infrastructure',      'Internal tools, systems, and technical foundations', '🔧'),
  ('Process Improvement', 'Workflow and process optimization suggestions',      '⚙️'),
  ('Product',             'Product features and enhancements',                  '📦'),
  ('Technology',          'Tech innovations, tools, and infrastructure ideas',  '💻'),
  ('Other',               'Ideas that don''t fit other categories',             '💡')
ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon, description = EXCLUDED.description;
