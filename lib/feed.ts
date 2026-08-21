import { sql } from "./db";

export type FeedEventType =
  | "new_joiner" | "birthday_today" | "birthday_upcoming"
  | "idea_shared" | "certification" | "work_anniversary"
  | "milestone" | "achievement";

export type SourceApp = "ideahub" | "skillshub" | "birthdayhub" | "engage";

export async function createFeedEvent(opts: {
  eventType: FeedEventType;
  sourceApp: SourceApp;
  userId: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  pinned?: boolean;
  eventDate?: string;
}) {
  const rows = await sql`
    INSERT INTO engage.feed_events (event_type, source_app, user_id, title, description, metadata, pinned, event_date)
    VALUES (
      ${opts.eventType}, ${opts.sourceApp}, ${opts.userId}, ${opts.title},
      ${opts.description ?? null}, ${JSON.stringify(opts.metadata ?? {})},
      ${opts.pinned ?? false}, ${opts.eventDate ?? new Date().toISOString().slice(0, 10)}
    )
    RETURNING id
  `;
  return rows[0]?.id as string;
}

export async function getFeedEvents(opts: {
  page?: number;
  limit?: number;
  userId?: string;
}) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const offset = (page - 1) * limit;

  const rows = await sql`
    SELECT
      fe.id, fe.event_type, fe.source_app, fe.user_id, fe.title, fe.description,
      fe.metadata, fe.pinned, fe.event_date, fe.created_at,
      u.name AS user_name, u.avatar_url AS user_avatar, u.email AS user_email,
      (SELECT COUNT(*)::int FROM engage.reactions r WHERE r.feed_event_id = fe.id AND r.reaction_type = 'like') AS like_count,
      (SELECT COUNT(*)::int FROM engage.reactions r WHERE r.feed_event_id = fe.id AND r.reaction_type = 'celebrate') AS celebrate_count,
      (SELECT COUNT(*)::int FROM engage.feed_comments fc WHERE fc.feed_event_id = fe.id) AS comment_count,
      CASE WHEN ${opts.userId ?? null}::uuid IS NOT NULL THEN
        (SELECT COALESCE(json_agg(r.reaction_type), '[]'::json) FROM engage.reactions r WHERE r.feed_event_id = fe.id AND r.user_id = ${opts.userId ?? null})
      ELSE '[]'::json END AS my_reactions
    FROM engage.feed_events fe
    JOIN auth.users u ON u.id = fe.user_id
    ORDER BY fe.pinned DESC, fe.event_date DESC, fe.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countRows = await sql`SELECT COUNT(*)::int AS total FROM engage.feed_events`;
  const total = (countRows[0]?.total as number) ?? 0;

  const events = await Promise.all(
    (rows as Record<string, unknown>[]).map(async (fe) => {
      const comments = await sql`
        SELECT fc.id, fc.body, fc.created_at, u.name AS user_name, u.avatar_url AS user_avatar
        FROM engage.feed_comments fc
        JOIN auth.users u ON u.id = fc.user_id
        WHERE fc.feed_event_id = ${fe.id as string}
        ORDER BY fc.created_at DESC
        LIMIT 2
      `;

      let groupCard = null;
      if (fe.event_type === "birthday_today" || fe.event_type === "birthday_upcoming") {
        const cardRows = await sql`
          SELECT gc.id, gc.status, gc.closes_at,
            (SELECT COUNT(*)::int FROM birthdayhub.card_signatures cs WHERE cs.card_id = gc.id) AS signature_count
          FROM birthdayhub.group_cards gc
          WHERE gc.birthday_user_id = ${fe.user_id as string}
            AND gc.event_date = ${fe.event_date as string}
          LIMIT 1
        `;
        if ((cardRows as unknown[]).length > 0) {
          const card = cardRows[0] as Record<string, unknown>;
          const signatures = await sql`
            SELECT cs.message, cs.created_at, u.name AS user_name, u.avatar_url AS user_avatar
            FROM birthdayhub.card_signatures cs
            JOIN auth.users u ON u.id = cs.user_id
            WHERE cs.card_id = ${card.id as string}
            ORDER BY cs.created_at DESC
            LIMIT 5
          `;
          groupCard = { ...card, signatures };
        }
      }

      let ideaData = null;
      if (fe.event_type === "idea_shared") {
        const meta = fe.metadata as Record<string, unknown>;
        const ideaId = meta?.ideaId as string | undefined;
        if (ideaId) {
          const ideaRows = await sql`
            SELECT i.id, i.is_anonymous,
              (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'up') AS up_votes,
              (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'down') AS down_votes,
              (SELECT COUNT(*)::int FROM ideahub.comments c WHERE c.idea_id = i.id) AS idea_comment_count
            FROM ideahub.ideas i WHERE i.id = ${ideaId}
          `;
          if ((ideaRows as unknown[]).length > 0) ideaData = ideaRows[0];
        }
      }

      return { ...fe, comments, groupCard, ideaData };
    })
  );

  return { events, total, page, limit };
}

export async function createGroupCard(birthdayUserId: string, eventDate: string, closesAt: string) {
  const rows = await sql`
    INSERT INTO birthdayhub.group_cards (birthday_user_id, event_date, closes_at)
    VALUES (${birthdayUserId}, ${eventDate}, ${closesAt})
    ON CONFLICT (birthday_user_id, event_date) DO NOTHING
    RETURNING id
  `;
  return rows[0]?.id as string | undefined;
}

export async function signGroupCard(cardId: string, userId: string, message: string) {
  const rows = await sql`
    INSERT INTO birthdayhub.card_signatures (card_id, user_id, message)
    VALUES (${cardId}, ${userId}, ${message})
    ON CONFLICT (card_id, user_id) DO UPDATE SET message = EXCLUDED.message, created_at = NOW()
    RETURNING id
  `;
  return rows[0]?.id as string;
}

export async function toggleReaction(feedEventId: string, userId: string, reactionType: "like" | "celebrate") {
  const existing = await sql`
    SELECT id FROM engage.reactions
    WHERE feed_event_id = ${feedEventId} AND user_id = ${userId} AND reaction_type = ${reactionType}
  `;

  if ((existing as unknown[]).length > 0) {
    await sql`
      DELETE FROM engage.reactions
      WHERE feed_event_id = ${feedEventId} AND user_id = ${userId} AND reaction_type = ${reactionType}
    `;
    return { added: false };
  }

  await sql`
    INSERT INTO engage.reactions (feed_event_id, user_id, reaction_type)
    VALUES (${feedEventId}, ${userId}, ${reactionType})
  `;
  return { added: true };
}

export async function addFeedComment(feedEventId: string, userId: string, body: string) {
  const rows = await sql`
    INSERT INTO engage.feed_comments (feed_event_id, user_id, body)
    VALUES (${feedEventId}, ${userId}, ${body})
    RETURNING id, body, created_at
  `;
  return rows[0];
}

export async function getFeedComments(feedEventId: string) {
  return sql`
    SELECT fc.id, fc.body, fc.created_at, u.name AS user_name, u.avatar_url AS user_avatar
    FROM engage.feed_comments fc
    JOIN auth.users u ON u.id = fc.user_id
    WHERE fc.feed_event_id = ${feedEventId}
    ORDER BY fc.created_at ASC
  `;
}
