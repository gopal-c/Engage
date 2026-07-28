import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const role = (session.user as { role?: string }).role ?? "employee";

  try {
    const [
      profileRows,
      birthdayRows,
      excludedRows,
      trendingRows,
      activityRows,
      myIdeaStats,
      myIdeaStatusChanges,
      milestonesRows,
      bookmarkRows,
      unvotedRows,
    ] = await Promise.all([
      // Profile data for greeting banner
      sql`
        SELECT p.id, p.name, p.joining_date, p.date_of_birth AS p_dob, p.skills, p.avatar_url,
               u.date_of_birth AS u_dob, u.bio
        FROM skillshub.profiles p
        LEFT JOIN auth.users u ON lower(u.email) = lower(p.email)
        WHERE p.user_id = ${userId} AND p.status = 'approved'
        LIMIT 1
      `,

      // Birthdays: today + next 7 days
      sql`
        SELECT DISTINCT ON (lower(combined.email))
          combined.name, combined.email, combined.avatar_url, combined.department,
          combined.bio, combined.user_id,
          to_char(combined.date_of_birth, 'MM-DD') AS birthday_mmdd
        FROM (
          SELECT p.name, p.email, p.avatar_url, p.city AS department, u.bio, p.user_id,
                 COALESCE(u.date_of_birth, p.date_of_birth) AS date_of_birth
          FROM skillshub.profiles p
          LEFT JOIN auth.users u ON lower(u.email) = lower(p.email)
          WHERE p.status = 'approved' AND COALESCE(u.date_of_birth, p.date_of_birth) IS NOT NULL
          UNION ALL
          SELECT u.name, u.email, u.avatar_url, NULL AS department, u.bio, u.id AS user_id,
                 u.date_of_birth
          FROM auth.users u
          WHERE u.date_of_birth IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM skillshub.profiles p WHERE lower(p.email) = lower(u.email) AND p.status = 'approved')
        ) combined
        WHERE to_char(combined.date_of_birth, 'MM-DD') >= to_char(NOW(), 'MM-DD')
          AND to_char(combined.date_of_birth, 'MM-DD') <= to_char(NOW() + INTERVAL '7 days', 'MM-DD')
        ORDER BY lower(combined.email), to_char(combined.date_of_birth, 'MM-DD') ASC
      `,

      // Excluded users for birthday filtering
      sql`SELECT user_id FROM birthdayhub.excluded_users`,

      // Trending idea
      sql`
        SELECT i.id, i.title, i.description, c.icon AS category_icon, c.name AS category_name,
          (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'up')
          - (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'down') AS net_votes,
          (SELECT COUNT(*)::int FROM ideahub.comments cm WHERE cm.idea_id = i.id) AS comment_count
        FROM ideahub.ideas i
        LEFT JOIN ideahub.categories c ON c.id = i.category_id
        ORDER BY i.trending_score DESC, i.created_at DESC
        LIMIT 1
      `,

      // Recent activity
      sql`
        SELECT af.id, af.source_app, af.event_type, af.title, af.description, af.created_at,
               u.name AS user_name, u.avatar_url AS user_avatar
        FROM engage.activity_feed af
        JOIN auth.users u ON u.id = af.user_id
        ORDER BY af.created_at DESC
        LIMIT 8
      `,

      // My idea stats
      sql`
        SELECT
          COUNT(*)::int AS idea_count,
          COALESCE(SUM(
            (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'up')
            - (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'down')
          ), 0)::int AS total_votes
        FROM ideahub.ideas i
        WHERE i.author_id = ${userId}
      `,

      // Recent status changes on my ideas
      sql`
        SELECT af.title, af.event_type, af.created_at, af.metadata
        FROM engage.activity_feed af
        WHERE af.metadata->>'ideaId' IN (
          SELECT id::text FROM ideahub.ideas WHERE author_id = ${userId}
        )
        AND af.event_type IN ('idea_status_changed', 'idea_approved', 'idea_implemented', 'idea_declined')
        ORDER BY af.created_at DESC
        LIMIT 3
      `,

      // My milestones
      sql`
        SELECT m.id, m.title, m.milestone_date, m.category
        FROM skillshub.milestones m
        JOIN skillshub.profiles p ON p.id = m.profile_id
        WHERE p.user_id = ${userId}
        ORDER BY m.milestone_date DESC
        LIMIT 5
      `,

      // Bookmarked ideas
      sql`
        SELECT i.id, i.title,
          (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'up')
          - (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'down') AS net_votes
        FROM ideahub.bookmarks b
        JOIN ideahub.ideas i ON i.id = b.idea_id
        WHERE b.user_id = ${userId}
        ORDER BY b.created_at DESC
        LIMIT 3
      `,

      // Ideas user hasn't voted on
      sql`
        SELECT i.id, i.title, i.description, c.icon AS category_icon,
          (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'up')
          - (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'down') AS net_votes
        FROM ideahub.ideas i
        LEFT JOIN ideahub.categories c ON c.id = i.category_id
        WHERE i.id NOT IN (SELECT idea_id FROM ideahub.votes WHERE user_id = ${userId})
          AND i.author_id != ${userId}
        ORDER BY i.created_at DESC
        LIMIT 5
      `,
    ]);

    // Process profile completion
    const profile = (profileRows as Record<string, unknown>[])[0] ?? null;
    let profileCompletion = 0;
    let profileFields = { hasDob: false, hasBio: false, hasSkills: false, hasMilestone: false };
    let anniversaryInfo = null;

    if (profile) {
      const dob = profile.u_dob ?? profile.p_dob;
      const bio = profile.bio as string | null;
      const skills = profile.skills as unknown[];
      const hasMilestone = (milestonesRows as unknown[]).length > 0;

      profileFields = {
        hasDob: !!dob,
        hasBio: !!bio && bio.trim().length > 0,
        hasSkills: Array.isArray(skills) && skills.length > 0,
        hasMilestone,
      };
      const completed = Object.values(profileFields).filter(Boolean).length;
      profileCompletion = Math.round((completed / 4) * 100);

      // Anniversary countdown
      if (profile.joining_date) {
        const joining = new Date(profile.joining_date as string);
        const now = new Date();
        const yearsWorked = now.getFullYear() - joining.getFullYear();
        const nextAnniversaryYear = yearsWorked + (
          new Date(now.getFullYear(), joining.getMonth(), joining.getDate()) <= now ? 1 : 0
        );
        const nextDate = new Date(joining.getFullYear() + nextAnniversaryYear, joining.getMonth(), joining.getDate());
        const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / 86400000);
        if (daysUntil <= 60 && nextAnniversaryYear > 0) {
          anniversaryInfo = { years: nextAnniversaryYear, daysUntil };
        }
      }
    }

    // Filter excluded users from birthdays
    const excludedIds = new Set((excludedRows as { user_id: string }[]).map((r) => r.user_id));
    const todayMMDD = new Date().toISOString().slice(5, 10);
    const allBirthdays = (birthdayRows as Record<string, unknown>[]).filter(
      (b) => !excludedIds.has(b.user_id as string)
    );
    const todayBirthdays = allBirthdays.filter((b) => b.birthday_mmdd === todayMMDD);
    const upcomingBirthdays = allBirthdays.filter((b) => b.birthday_mmdd !== todayMMDD);

    return NextResponse.json({
      user: {
        name: session.user.name,
        role,
        avatarUrl: session.user.image,
      },
      profileCompletion,
      profileFields,
      anniversaryInfo,
      birthdays: {
        today: todayBirthdays,
        upcoming: upcomingBirthdays.slice(0, 3),
      },
      trending: (trendingRows as unknown[])[0] ?? null,
      activity: activityRows,
      myIdeas: {
        count: ((myIdeaStats as Record<string, unknown>[])[0]?.idea_count as number) ?? 0,
        totalVotes: ((myIdeaStats as Record<string, unknown>[])[0]?.total_votes as number) ?? 0,
        recentStatusChanges: myIdeaStatusChanges,
      },
      milestones: milestonesRows,
      bookmarks: bookmarkRows,
      unvotedIdeas: unvotedRows,
    });
  } catch (err) {
    console.error("Dashboard API error:", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
