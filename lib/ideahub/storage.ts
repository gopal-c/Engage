import { sql } from "@/lib/db";
import { neon } from "@neondatabase/serverless";

/* ─────────── Types ─────────── */

export type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
};

export type Idea = {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
  isAnonymous: boolean;
  status: string;
  aiEnrichment: Record<string, unknown> | null;
  impactScore: number | null;
  feasibilityScore: number | null;
  trendingScore: number;
  netVotes: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
};

export type IdeaDetail = Idea & {
  bookmarkCount: number;
};

export type Comment = {
  id: string;
  ideaId: string;
  userId: string;
  userName: string | null;
  userAvatar: string | null;
  body: string;
  isAnonymous: boolean;
  parentId: string | null;
  reactions: Record<string, number>;
  createdAt: string;
};

export type LeaderboardEntry = {
  userId: string;
  userName: string;
  userAvatar: string | null;
  ideaCount: number;
  votesReceived: number;
  commentCount: number;
  totalScore: number;
  rank: number;
};

export type Badge = {
  id: string;
  badgeType: string;
  badgeName: string;
  earnedAt: string;
};

/* ─────────── Helpers ─────────── */

function getSQL() {
  return neon(process.env.POSTGRES_URL!);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJsonb(value: any): any {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value ?? null;
}

/* ─────────── Categories ─────────── */

export async function getCategories(): Promise<Category[]> {
  const rows = await sql`
    SELECT id, name, description, icon, created_at
    FROM ideahub.categories
    ORDER BY CASE WHEN name = 'Other' THEN 1 ELSE 0 END, name
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? null,
    icon: (r.icon as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

export async function createCategory(
  name: string,
  description: string | null,
  icon: string | null,
): Promise<Category> {
  const rows = await sql`
    INSERT INTO ideahub.categories (name, description, icon)
    VALUES (${name}, ${description}, ${icon})
    RETURNING id, name, description, icon, created_at
  `;
  const r = (rows as Record<string, unknown>[])[0];
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? null,
    icon: (r.icon as string) ?? null,
    createdAt: r.created_at as string,
  };
}

/* ─────────── Ideas ─────────── */

type GetIdeasOpts = {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  sort?: "trending" | "newest" | "most_voted";
  search?: string;
  authorId?: string;
};

export async function getIdeas(
  opts: GetIdeasOpts = {},
): Promise<{ ideas: Idea[]; total: number }> {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 10;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts.category) {
    params.push(opts.category);
    conditions.push(`i.category_id = $${params.length}`);
  }
  if (opts.status) {
    params.push(opts.status);
    conditions.push(`i.status = $${params.length}`);
  }
  if (opts.search) {
    params.push(`%${opts.search}%`);
    conditions.push(`(i.title ILIKE $${params.length} OR i.description ILIKE $${params.length})`);
  }
  if (opts.authorId) {
    params.push(opts.authorId);
    conditions.push(`i.author_id = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  let orderBy: string;
  switch (opts.sort) {
    case "newest":
      orderBy = "ORDER BY i.created_at DESC";
      break;
    case "most_voted":
      orderBy = "ORDER BY net_votes DESC, i.created_at DESC";
      break;
    case "trending":
    default:
      orderBy = "ORDER BY i.trending_score DESC, i.created_at DESC";
      break;
  }

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM ideahub.ideas i
    ${whereClause}
  `;

  const dataQuery = `
    SELECT
      i.id, i.title, i.description, i.category_id, i.author_id,
      i.is_anonymous, i.status, i.ai_enrichment,
      i.impact_score, i.feasibility_score, i.trending_score,
      i.created_at, i.updated_at,
      c.name AS category_name, c.icon AS category_icon,
      u.name AS author_name, u.avatar_url AS author_avatar,
      COALESCE((
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
        FROM ideahub.votes v WHERE v.idea_id = i.id
      ), 0)::int AS net_votes,
      COALESCE((
        SELECT COUNT(*) FROM ideahub.comments cm WHERE cm.idea_id = i.id
      ), 0)::int AS comment_count
    FROM ideahub.ideas i
    LEFT JOIN ideahub.categories c ON c.id = i.category_id
    LEFT JOIN auth.users u ON u.id = i.author_id
    ${whereClause}
    ${orderBy}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2}
  `;

  const dataParams = [...params, limit, offset];
  const client = getSQL();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [countRows, dataRows] = await Promise.all([
    (client as any).query(countQuery, params),
    (client as any).query(dataQuery, dataParams),
  ]);

  const total = (countRows as Record<string, unknown>[])[0]?.total as number ?? 0;

  const ideas: Idea[] = (dataRows as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    categoryId: (r.category_id as string) ?? null,
    categoryName: (r.category_name as string) ?? null,
    categoryIcon: (r.category_icon as string) ?? null,
    authorId: r.author_id as string,
    authorName: (r.author_name as string) ?? null,
    authorAvatar: (r.author_avatar as string) ?? null,
    isAnonymous: r.is_anonymous as boolean,
    status: r.status as string,
    aiEnrichment: parseJsonb(r.ai_enrichment),
    impactScore: (r.impact_score as number) ?? null,
    feasibilityScore: (r.feasibility_score as number) ?? null,
    trendingScore: (r.trending_score as number) ?? 0,
    netVotes: (r.net_votes as number) ?? 0,
    commentCount: (r.comment_count as number) ?? 0,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }));

  return { ideas, total };
}

export async function getIdea(id: string): Promise<IdeaDetail | null> {
  const rows = await sql`
    SELECT
      i.id, i.title, i.description, i.category_id, i.author_id,
      i.is_anonymous, i.status, i.ai_enrichment,
      i.impact_score, i.feasibility_score, i.trending_score,
      i.created_at, i.updated_at,
      c.name AS category_name, c.icon AS category_icon,
      u.name AS author_name, u.avatar_url AS author_avatar,
      COALESCE((
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
        FROM ideahub.votes v WHERE v.idea_id = i.id
      ), 0)::int AS net_votes,
      COALESCE((
        SELECT COUNT(*) FROM ideahub.comments cm WHERE cm.idea_id = i.id
      ), 0)::int AS comment_count,
      COALESCE((
        SELECT COUNT(*) FROM ideahub.bookmarks bk WHERE bk.idea_id = i.id
      ), 0)::int AS bookmark_count
    FROM ideahub.ideas i
    LEFT JOIN ideahub.categories c ON c.id = i.category_id
    LEFT JOIN auth.users u ON u.id = i.author_id
    WHERE i.id = ${id}
    LIMIT 1
  `;
  const r = (rows as Record<string, unknown>[])[0];
  if (!r) return null;

  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    categoryId: (r.category_id as string) ?? null,
    categoryName: (r.category_name as string) ?? null,
    categoryIcon: (r.category_icon as string) ?? null,
    authorId: r.author_id as string,
    authorName: (r.author_name as string) ?? null,
    authorAvatar: (r.author_avatar as string) ?? null,
    isAnonymous: r.is_anonymous as boolean,
    status: r.status as string,
    aiEnrichment: parseJsonb(r.ai_enrichment),
    impactScore: (r.impact_score as number) ?? null,
    feasibilityScore: (r.feasibility_score as number) ?? null,
    trendingScore: (r.trending_score as number) ?? 0,
    netVotes: (r.net_votes as number) ?? 0,
    commentCount: (r.comment_count as number) ?? 0,
    bookmarkCount: (r.bookmark_count as number) ?? 0,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function createIdea(data: {
  title: string;
  description: string;
  categoryId: string | null;
  authorId: string;
  isAnonymous: boolean;
  aiEnrichment?: Record<string, unknown> | null;
  impactScore?: number | null;
  feasibilityScore?: number | null;
}): Promise<Idea> {
  const rows = await sql`
    INSERT INTO ideahub.ideas (
      title, description, category_id, author_id, is_anonymous,
      ai_enrichment, impact_score, feasibility_score
    ) VALUES (
      ${data.title}, ${data.description}, ${data.categoryId},
      ${data.authorId}, ${data.isAnonymous},
      ${data.aiEnrichment ? JSON.stringify(data.aiEnrichment) : null}::jsonb,
      ${data.impactScore ?? null}, ${data.feasibilityScore ?? null}
    )
    RETURNING *
  `;
  const r = (rows as Record<string, unknown>[])[0];
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    categoryId: (r.category_id as string) ?? null,
    categoryName: null,
    categoryIcon: null,
    authorId: r.author_id as string,
    authorName: null,
    authorAvatar: null,
    isAnonymous: r.is_anonymous as boolean,
    status: r.status as string,
    aiEnrichment: parseJsonb(r.ai_enrichment),
    impactScore: (r.impact_score as number) ?? null,
    feasibilityScore: (r.feasibility_score as number) ?? null,
    trendingScore: (r.trending_score as number) ?? 0,
    netVotes: 0,
    commentCount: 0,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function updateIdea(
  id: string,
  patch: Partial<{
    title: string;
    description: string;
    categoryId: string | null;
    isAnonymous: boolean;
    status: string;
    aiEnrichment: Record<string, unknown> | null;
    impactScore: number | null;
    feasibilityScore: number | null;
    trendingScore: number;
  }>,
): Promise<Idea | null> {
  const client = getSQL();
  const sets: string[] = [];
  const values: unknown[] = [];
  const map: Record<string, string> = {
    title: "title",
    description: "description",
    categoryId: "category_id",
    isAnonymous: "is_anonymous",
    status: "status",
    aiEnrichment: "ai_enrichment",
    impactScore: "impact_score",
    feasibilityScore: "feasibility_score",
    trendingScore: "trending_score",
  };

  for (const [k, v] of Object.entries(patch)) {
    if (!(k in map) || v === undefined) continue;
    const col = map[k];
    if (k === "aiEnrichment") {
      values.push(v ? JSON.stringify(v) : null);
      sets.push(`${col} = $${values.length}::jsonb`);
    } else {
      values.push(v);
      sets.push(`${col} = $${values.length}`);
    }
  }

  if (sets.length === 0) return getIdea(id);
  sets.push("updated_at = NOW()");
  values.push(id);

  const query = `UPDATE ideahub.ideas SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (client as any).query(query, values) as Record<string, unknown>[];
  const r = rows[0];
  if (!r) return null;

  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string,
    categoryId: (r.category_id as string) ?? null,
    categoryName: null,
    categoryIcon: null,
    authorId: r.author_id as string,
    authorName: null,
    authorAvatar: null,
    isAnonymous: r.is_anonymous as boolean,
    status: r.status as string,
    aiEnrichment: parseJsonb(r.ai_enrichment),
    impactScore: (r.impact_score as number) ?? null,
    feasibilityScore: (r.feasibility_score as number) ?? null,
    trendingScore: (r.trending_score as number) ?? 0,
    netVotes: 0,
    commentCount: 0,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function deleteIdea(id: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM ideahub.ideas WHERE id = ${id} RETURNING id
  `;
  return (rows as unknown[]).length > 0;
}

/* ─────────── Votes ─────────── */

export async function getVote(
  ideaId: string,
  userId: string,
): Promise<{ vote_type: string } | null> {
  const rows = await sql`
    SELECT vote_type FROM ideahub.votes
    WHERE idea_id = ${ideaId} AND user_id = ${userId}
    LIMIT 1
  `;
  const r = (rows as Record<string, unknown>[])[0];
  return r ? { vote_type: r.vote_type as string } : null;
}

export async function upsertVote(
  ideaId: string,
  userId: string,
  voteType: string,
): Promise<void> {
  await sql`
    INSERT INTO ideahub.votes (idea_id, user_id, vote_type)
    VALUES (${ideaId}, ${userId}, ${voteType})
    ON CONFLICT (idea_id, user_id)
    DO UPDATE SET vote_type = ${voteType}, created_at = NOW()
  `;
}

export async function removeVote(
  ideaId: string,
  userId: string,
): Promise<void> {
  await sql`
    DELETE FROM ideahub.votes
    WHERE idea_id = ${ideaId} AND user_id = ${userId}
  `;
}

export async function getVoteCounts(
  ideaId: string,
): Promise<{ up: number; down: number }> {
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE vote_type = 'up')::int AS up,
      COUNT(*) FILTER (WHERE vote_type = 'down')::int AS down
    FROM ideahub.votes
    WHERE idea_id = ${ideaId}
  `;
  const r = (rows as Record<string, unknown>[])[0];
  return {
    up: (r?.up as number) ?? 0,
    down: (r?.down as number) ?? 0,
  };
}

/* ─────────── Comments ─────────── */

export async function getComments(ideaId: string): Promise<Comment[]> {
  const rows = await sql`
    SELECT
      cm.id, cm.idea_id, cm.user_id, cm.body, cm.is_anonymous, cm.parent_id,
      cm.created_at,
      u.name AS user_name, u.avatar_url AS user_avatar,
      COALESCE((
        SELECT jsonb_object_agg(emoji, cnt)
        FROM (
          SELECT emoji, COUNT(*)::int AS cnt
          FROM ideahub.comment_reactions cr
          WHERE cr.comment_id = cm.id
          GROUP BY emoji
        ) sub
      ), '{}'::jsonb) AS reactions
    FROM ideahub.comments cm
    LEFT JOIN auth.users u ON u.id = cm.user_id
    WHERE cm.idea_id = ${ideaId}
    ORDER BY cm.created_at ASC
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    ideaId: r.idea_id as string,
    userId: r.user_id as string,
    userName: (r.user_name as string) ?? null,
    userAvatar: (r.user_avatar as string) ?? null,
    body: r.body as string,
    isAnonymous: r.is_anonymous as boolean,
    parentId: (r.parent_id as string) ?? null,
    reactions: parseJsonb(r.reactions) ?? {},
    createdAt: r.created_at as string,
  }));
}

export async function createComment(data: {
  ideaId: string;
  userId: string;
  body: string;
  isAnonymous: boolean;
  parentId?: string | null;
}): Promise<Comment> {
  const rows = await sql`
    INSERT INTO ideahub.comments (idea_id, user_id, body, is_anonymous, parent_id)
    VALUES (${data.ideaId}, ${data.userId}, ${data.body}, ${data.isAnonymous}, ${data.parentId ?? null})
    RETURNING id, idea_id, user_id, body, is_anonymous, parent_id, created_at
  `;
  const r = (rows as Record<string, unknown>[])[0];
  return {
    id: r.id as string,
    ideaId: r.idea_id as string,
    userId: r.user_id as string,
    userName: null,
    userAvatar: null,
    body: r.body as string,
    isAnonymous: r.is_anonymous as boolean,
    parentId: (r.parent_id as string) ?? null,
    reactions: {},
    createdAt: r.created_at as string,
  };
}

export async function deleteComment(id: string): Promise<boolean> {
  const rows = await sql`
    DELETE FROM ideahub.comments WHERE id = ${id} RETURNING id
  `;
  return (rows as unknown[]).length > 0;
}

/* ─────────── Comment Reactions ─────────── */

export async function toggleReaction(
  commentId: string,
  userId: string,
  emoji: string,
): Promise<{ added: boolean }> {
  // Try to insert; if conflict, delete instead
  const inserted = await sql`
    INSERT INTO ideahub.comment_reactions (comment_id, user_id, emoji)
    VALUES (${commentId}, ${userId}, ${emoji})
    ON CONFLICT (comment_id, user_id, emoji) DO NOTHING
    RETURNING id
  `;
  if ((inserted as unknown[]).length > 0) {
    return { added: true };
  }
  // Already existed — remove it
  await sql`
    DELETE FROM ideahub.comment_reactions
    WHERE comment_id = ${commentId} AND user_id = ${userId} AND emoji = ${emoji}
  `;
  return { added: false };
}

/* ─────────── Bookmarks ─────────── */

export async function isBookmarked(
  ideaId: string,
  userId: string,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM ideahub.bookmarks
    WHERE idea_id = ${ideaId} AND user_id = ${userId}
    LIMIT 1
  `;
  return (rows as unknown[]).length > 0;
}

export async function toggleBookmark(
  ideaId: string,
  userId: string,
): Promise<{ bookmarked: boolean }> {
  const inserted = await sql`
    INSERT INTO ideahub.bookmarks (idea_id, user_id)
    VALUES (${ideaId}, ${userId})
    ON CONFLICT (idea_id, user_id) DO NOTHING
    RETURNING id
  `;
  if ((inserted as unknown[]).length > 0) {
    return { bookmarked: true };
  }
  await sql`
    DELETE FROM ideahub.bookmarks
    WHERE idea_id = ${ideaId} AND user_id = ${userId}
  `;
  return { bookmarked: false };
}

export async function getUserBookmarks(userId: string): Promise<string[]> {
  const rows = await sql`
    SELECT idea_id FROM ideahub.bookmarks
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return (rows as Record<string, unknown>[]).map((r) => r.idea_id as string);
}

/* ─────────── Leaderboard ─────────── */

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const rows = await sql`
    WITH idea_stats AS (
      SELECT
        i.author_id,
        COUNT(*)::int AS idea_count,
        COALESCE(SUM((
          SELECT COUNT(*) FROM ideahub.votes v WHERE v.idea_id = i.id
        )), 0)::int AS votes_received
      FROM ideahub.ideas i
      WHERE i.is_anonymous = false
      GROUP BY i.author_id
    ),
    comment_stats AS (
      SELECT
        cm.user_id,
        COUNT(*)::int AS comment_count
      FROM ideahub.comments cm
      WHERE cm.is_anonymous = false
      GROUP BY cm.user_id
    ),
    combined AS (
      SELECT
        COALESCE(ist.author_id, cs.user_id) AS user_id,
        COALESCE(ist.idea_count, 0) AS idea_count,
        COALESCE(ist.votes_received, 0) AS votes_received,
        COALESCE(cs.comment_count, 0) AS comment_count,
        (COALESCE(ist.idea_count, 0) * 3 + COALESCE(ist.votes_received, 0) + COALESCE(cs.comment_count, 0)) AS total_score
      FROM idea_stats ist
      FULL OUTER JOIN comment_stats cs ON ist.author_id = cs.user_id
    )
    SELECT
      cb.user_id, cb.idea_count, cb.votes_received, cb.comment_count, cb.total_score,
      u.name AS user_name, u.avatar_url AS user_avatar,
      ROW_NUMBER() OVER (ORDER BY cb.total_score DESC)::int AS rank
    FROM combined cb
    JOIN auth.users u ON u.id = cb.user_id
    ORDER BY cb.total_score DESC
    LIMIT 20
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    userId: r.user_id as string,
    userName: r.user_name as string,
    userAvatar: (r.user_avatar as string) ?? null,
    ideaCount: (r.idea_count as number) ?? 0,
    votesReceived: (r.votes_received as number) ?? 0,
    commentCount: (r.comment_count as number) ?? 0,
    totalScore: (r.total_score as number) ?? 0,
    rank: (r.rank as number) ?? 0,
  }));
}

/* ─────────── Badges ─────────── */

export async function getUserBadges(userId: string): Promise<Badge[]> {
  const rows = await sql`
    SELECT id, badge_type, badge_name, earned_at
    FROM ideahub.badges
    WHERE user_id = ${userId}
    ORDER BY earned_at DESC
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    badgeType: r.badge_type as string,
    badgeName: r.badge_name as string,
    earnedAt: r.earned_at as string,
  }));
}

export async function awardBadge(
  userId: string,
  badgeType: string,
  badgeName: string,
): Promise<void> {
  await sql`
    INSERT INTO ideahub.badges (user_id, badge_type, badge_name)
    VALUES (${userId}, ${badgeType}, ${badgeName})
    ON CONFLICT (user_id, badge_type) DO NOTHING
  `;
}
