import { sql } from "./db";

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const LEVEL_TITLES = [
  "Newcomer", "Contributor", "Active Member", "Team Player", "Influencer",
  "Champion", "Trailblazer", "Innovator", "Visionary", "Legend",
];

export type XPAction =
  | "idea_submitted" | "idea_upvoted" | "comment_posted" | "card_signed"
  | "milestone_added" | "onboarding_completed" | "reaction_added"
  | "project_created" | "project_joined" | "project_completed" | "project_milestone_done" | "project_message_sent";

const XP_AMOUNTS: Record<XPAction, number> = {
  idea_submitted: 20,
  idea_upvoted: 5,
  comment_posted: 5,
  card_signed: 10,
  milestone_added: 15,
  onboarding_completed: 25,
  reaction_added: 2,
  project_created: 25,
  project_joined: 10,
  project_completed: 30,
  project_milestone_done: 15,
  project_message_sent: 2,
};

export function getLevelForXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? "Newcomer";
}

export function getXPForNextLevel(level: number): number | null {
  if (level >= LEVEL_THRESHOLDS.length) return null;
  return LEVEL_THRESHOLDS[level] ?? null;
}

export async function awardXP(
  userId: string,
  sourceApp: string,
  action: XPAction,
  xpOverride?: number,
) {
  const xpAmount = xpOverride ?? XP_AMOUNTS[action] ?? 0;
  if (xpAmount <= 0) return;

  await sql`
    INSERT INTO engage.xp_events (user_id, source_app, action, xp_amount)
    VALUES (${userId}, ${sourceApp}, ${action}, ${xpAmount})
  `;

  const rows = await sql`
    INSERT INTO engage.user_levels (user_id, total_xp, level, updated_at)
    VALUES (${userId}, ${xpAmount}, ${getLevelForXP(xpAmount)}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      total_xp = engage.user_levels.total_xp + ${xpAmount},
      level = ${getLevelForXP(0)},
      updated_at = NOW()
    RETURNING total_xp
  `;

  const totalXP = (rows[0]?.total_xp as number) ?? xpAmount;
  const newLevel = getLevelForXP(totalXP);

  await sql`
    UPDATE engage.user_levels SET level = ${newLevel} WHERE user_id = ${userId}
  `;

  await checkAndAwardBadges(userId, action, totalXP, newLevel);
}

export async function getUserLevel(userId: string) {
  const rows = await sql`
    SELECT total_xp, level FROM engage.user_levels WHERE user_id = ${userId}
  `;
  if (rows.length === 0) {
    return { totalXP: 0, level: 1, title: LEVEL_TITLES[0], nextLevelXP: LEVEL_THRESHOLDS[1], currentLevelXP: 0 };
  }
  const { total_xp, level } = rows[0] as { total_xp: number; level: number };
  return {
    totalXP: total_xp,
    level,
    title: getLevelTitle(level),
    nextLevelXP: getXPForNextLevel(level),
    currentLevelXP: LEVEL_THRESHOLDS[level - 1] ?? 0,
  };
}

export async function getUserBadges(userId: string) {
  return sql`
    SELECT badge_key, badge_name, badge_icon, earned_at
    FROM engage.user_badges
    WHERE user_id = ${userId}
    ORDER BY earned_at DESC
  `;
}

const BADGE_DEFS = [
  { key: "first_idea", name: "First Idea", icon: "\u{1F680}", check: "idea_count", threshold: 1 },
  { key: "idea_machine", name: "Idea Machine", icon: "\u{1F4A1}", check: "idea_count", threshold: 10 },
  { key: "voter", name: "Voter", icon: "\u{1F5F3}️", check: "vote_count", threshold: 50 },
  { key: "conversationalist", name: "Conversationalist", icon: "\u{1F4AC}", check: "comment_count", threshold: 25 },
  { key: "card_signer", name: "Card Signer", icon: "\u{1F382}", check: "sign_count", threshold: 10 },
  { key: "top_contributor", name: "Top Contributor", icon: "\u{1F3C6}", check: "level", threshold: 5 },
  { key: "superstar", name: "Superstar", icon: "⭐", check: "level", threshold: 8 },
  { key: "sharpshooter", name: "Sharpshooter", icon: "\u{1F3AF}", check: "approved_ideas", threshold: 3 },
  { key: "welcomer", name: "Welcomer", icon: "\u{1F91D}", check: "welcome_comments", threshold: 5 },
] as const;

export const ALL_BADGES = BADGE_DEFS.map((b) => ({
  key: b.key, name: b.name, icon: b.icon,
  description: `Requires ${b.check === "level" ? `Level ${b.threshold}` : `${b.threshold} ${b.check.replace("_", " ")}`}`,
}));

async function checkAndAwardBadges(userId: string, action: XPAction, totalXP: number, level: number) {
  const existing = await sql`SELECT badge_key FROM engage.user_badges WHERE user_id = ${userId}`;
  const earned = new Set((existing as { badge_key: string }[]).map((r) => r.badge_key));

  for (const badge of BADGE_DEFS) {
    if (earned.has(badge.key)) continue;

    let qualifies = false;

    switch (badge.check) {
      case "level":
        qualifies = level >= badge.threshold;
        break;
      case "idea_count": {
        if (action !== "idea_submitted") continue;
        const r = await sql`SELECT COUNT(*)::int AS c FROM engage.xp_events WHERE user_id = ${userId} AND action = 'idea_submitted'`;
        qualifies = ((r[0]?.c as number) ?? 0) >= badge.threshold;
        break;
      }
      case "vote_count": {
        const r = await sql`SELECT COUNT(*)::int AS c FROM ideahub.votes WHERE user_id = ${userId}`;
        qualifies = ((r[0]?.c as number) ?? 0) >= badge.threshold;
        break;
      }
      case "comment_count": {
        if (action !== "comment_posted") continue;
        const r = await sql`SELECT COUNT(*)::int AS c FROM engage.feed_comments WHERE user_id = ${userId}`;
        qualifies = ((r[0]?.c as number) ?? 0) >= badge.threshold;
        break;
      }
      case "sign_count": {
        if (action !== "card_signed") continue;
        const r = await sql`SELECT COUNT(*)::int AS c FROM birthdayhub.card_signatures WHERE user_id = ${userId}`;
        qualifies = ((r[0]?.c as number) ?? 0) >= badge.threshold;
        break;
      }
      case "approved_ideas": {
        const r = await sql`SELECT COUNT(*)::int AS c FROM ideahub.ideas WHERE author_id = ${userId} AND status = 'approved'`;
        qualifies = ((r[0]?.c as number) ?? 0) >= badge.threshold;
        break;
      }
      case "welcome_comments": {
        if (action !== "comment_posted") continue;
        const r = await sql`
          SELECT COUNT(DISTINCT fc.feed_event_id)::int AS c
          FROM engage.feed_comments fc
          JOIN engage.feed_events fe ON fe.id = fc.feed_event_id
          WHERE fc.user_id = ${userId} AND fe.event_type = 'new_joiner'
        `;
        qualifies = ((r[0]?.c as number) ?? 0) >= badge.threshold;
        break;
      }
    }

    if (qualifies) {
      await sql`
        INSERT INTO engage.user_badges (user_id, badge_key, badge_name, badge_icon)
        VALUES (${userId}, ${badge.key}, ${badge.name}, ${badge.icon})
        ON CONFLICT (user_id, badge_key) DO NOTHING
      `.catch(() => {});
    }
  }
}
