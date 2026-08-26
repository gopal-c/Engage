import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { createFeedEvent, createGroupCard } from "@/lib/feed";
import { awardXP } from "@/lib/xp";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "admin" && role !== "hr") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const counts = { ideas: 0, birthdays: 0, milestones: 0, joiners: 0, profilesCreated: 0 };
    const skipped: string[] = [];

    // --- 0) Auto-create pending profiles for auth users without one ---
    const usersWithoutProfile = await sql`
      SELECT u.id, u.name, u.email
      FROM auth.users u
      WHERE NOT EXISTS (
        SELECT 1 FROM skillshub.profiles p
        WHERE p.user_id = u.id OR lower(p.email) = lower(u.email)
      )
    `;

    for (const row of usersWithoutProfile) {
      try {
        await sql`
          INSERT INTO skillshub.profiles (id, user_id, status, name, email)
          VALUES (gen_random_uuid(), ${row.id}, 'pending', ${row.name}, ${row.email})
          ON CONFLICT DO NOTHING
        `;
        counts.profilesCreated++;
      } catch (err) {
        skipped.push(`auto-profile ${row.id}: ${String(err)}`);
      }
    }

    // --- 0b) Remove new_joiner feed events for users without a joining_date ---
    await sql`
      DELETE FROM engage.feed_events
      WHERE event_type = 'new_joiner'
        AND NOT EXISTS (
          SELECT 1 FROM skillshub.profiles p
          WHERE p.user_id = engage.feed_events.user_id
            AND p.joining_date IS NOT NULL
        )
    `;

    // --- a) Ideas -> idea_shared events + XP ---
    const ideas = await sql`
      SELECT i.id, i.title, i.description, i.author_id, i.is_anonymous, i.created_at
      FROM ideahub.ideas i
      WHERE NOT EXISTS (
        SELECT 1 FROM engage.feed_events fe
        WHERE fe.event_type = 'idea_shared' AND fe.metadata->>'ideaId' = i.id::text
      )
      ORDER BY i.created_at DESC
      LIMIT 50
    `;

    for (const row of ideas) {
      try {
        if (!row.author_id || !row.title) {
          skipped.push(`idea ${row.id}: missing author_id or title`);
          continue;
        }
        await createFeedEvent({
          eventType: "idea_shared",
          sourceApp: "ideahub",
          userId: row.author_id,
          title: row.title,
          description: row.description?.slice(0, 200),
          metadata: { ideaId: row.id, isAnonymous: row.is_anonymous },
          eventDate: row.created_at?.toISOString?.()
            ? row.created_at.toISOString().slice(0, 10)
            : String(row.created_at).slice(0, 10),
        });
        await awardXP(row.author_id, "ideahub", "idea_submitted");
        counts.ideas++;
      } catch (err) {
        skipped.push(`idea ${row.id}: ${String(err)}`);
      }
    }

    // --- a2) Backfill XP for ideas that have feed events but no xp_event ---
    const ideasMissingXP = await sql`
      SELECT i.id, i.author_id
      FROM ideahub.ideas i
      WHERE i.author_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM engage.feed_events fe
          WHERE fe.event_type = 'idea_shared' AND fe.metadata->>'ideaId' = i.id::text
        )
        AND NOT EXISTS (
          SELECT 1 FROM engage.xp_events xe
          WHERE xe.user_id = i.author_id AND xe.action = 'idea_submitted'
            AND xe.source_app = 'ideahub'
        )
    `;

    for (const row of ideasMissingXP) {
      try {
        await awardXP(row.author_id, "ideahub", "idea_submitted");
        counts.ideas++;
      } catch (err) {
        skipped.push(`idea-xp-backfill ${row.id}: ${String(err)}`);
      }
    }

    // --- b0) Clean up stale birthday events (user changed their birthdate) ---
    await sql`
      DELETE FROM engage.feed_events fe
      WHERE fe.event_type IN ('birthday_today', 'birthday_upcoming')
        AND EXISTS (
          SELECT 1 FROM auth.users u
          WHERE u.id = fe.user_id
            AND u.date_of_birth IS NOT NULL
            AND to_char(u.date_of_birth, 'MM-DD') != to_char(fe.event_date, 'MM-DD')
        )
    `;

    // --- b) Birthdays today + next 3 days ---
    const todayMmDd = new Date().toISOString().slice(5, 10);
    const currentYear = new Date().getFullYear();

    const birthdays = await sql`
      SELECT DISTINCT ON (u.id) u.id, u.name, u.email,
        to_char(u.date_of_birth, 'MM-DD') AS birthday_mmdd
      FROM auth.users u
      LEFT JOIN birthdayhub.excluded_users ex ON ex.user_id = u.id
      WHERE u.date_of_birth IS NOT NULL AND ex.user_id IS NULL
        AND to_char(u.date_of_birth, 'MM-DD') >= to_char(NOW(), 'MM-DD')
        AND to_char(u.date_of_birth, 'MM-DD') <= to_char(NOW() + INTERVAL '3 days', 'MM-DD')
    `;

    for (const row of birthdays) {
      try {
        if (!row.id || !row.name) {
          skipped.push(`birthday user ${row.id}: missing name`);
          continue;
        }
        const eventDate = `${currentYear}-${row.birthday_mmdd}`;
        const eventType = row.birthday_mmdd === todayMmDd ? "birthday_today" : "birthday_upcoming";

        const existing = await sql`
          SELECT 1 FROM engage.feed_events fe
          WHERE fe.event_type IN ('birthday_today', 'birthday_upcoming')
            AND fe.user_id = ${row.id}
            AND fe.event_date = ${eventDate}
        `;

        if (existing.length === 0) {
          await createFeedEvent({
            eventType,
            sourceApp: "birthdayhub",
            userId: row.id,
            title: `${row.name}'s birthday`,
            pinned: eventType === "birthday_today",
            eventDate,
          });

          const closesAt = `${eventDate} 23:59:59`;
          await createGroupCard(row.id, eventDate, closesAt);
          counts.birthdays++;
        }
      } catch (err) {
        skipped.push(`birthday ${row.id}: ${String(err)}`);
      }
    }

    // --- c) Milestones / certifications + XP ---
    const milestones = await sql`
      SELECT m.id, m.title, m.milestone_date, m.category,
        COALESCE(p.user_id, u.id) AS user_id
      FROM skillshub.milestones m
      JOIN skillshub.profiles p ON p.id = m.profile_id
      LEFT JOIN auth.users u ON lower(u.email) = lower(p.email)
      WHERE NOT EXISTS (
        SELECT 1 FROM engage.feed_events fe
        WHERE fe.event_type IN ('milestone', 'certification')
          AND fe.metadata->>'milestoneId' = m.id::text
      )
      ORDER BY m.milestone_date DESC
      LIMIT 50
    `;

    for (const row of milestones) {
      try {
        if (!row.user_id || !row.title) {
          skipped.push(`milestone ${row.id}: no linked user`);
          continue;
        }
        const eventType = row.category === "certification" ? "certification" : "milestone";
        await createFeedEvent({
          eventType,
          sourceApp: "skillshub",
          userId: row.user_id,
          title: row.title,
          metadata: { milestoneId: row.id, category: row.category },
          eventDate: row.milestone_date?.toISOString?.()
            ? row.milestone_date.toISOString().slice(0, 10)
            : String(row.milestone_date).slice(0, 10),
        });
        await awardXP(row.user_id, "skillshub", "milestone_added");
        counts.milestones++;
      } catch (err) {
        skipped.push(`milestone ${row.id}: ${String(err)}`);
      }
    }

    // --- c2) Backfill XP for milestones that have feed events but no xp_event ---
    const milestonesMissingXP = await sql`
      SELECT m.id, COALESCE(p.user_id, u.id) AS user_id
      FROM skillshub.milestones m
      JOIN skillshub.profiles p ON p.id = m.profile_id
      LEFT JOIN auth.users u ON lower(u.email) = lower(p.email)
      WHERE COALESCE(p.user_id, u.id) IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM engage.feed_events fe
          WHERE fe.event_type IN ('milestone', 'certification')
            AND fe.metadata->>'milestoneId' = m.id::text
        )
        AND NOT EXISTS (
          SELECT 1 FROM engage.xp_events xe
          WHERE xe.user_id = COALESCE(p.user_id, u.id)
            AND xe.action = 'milestone_added' AND xe.source_app = 'skillshub'
        )
    `;

    for (const row of milestonesMissingXP) {
      try {
        await awardXP(row.user_id, "skillshub", "milestone_added");
        counts.milestones++;
      } catch (err) {
        skipped.push(`milestone-xp-backfill ${row.id}: ${String(err)}`);
      }
    }

    // --- d0) Fix existing new_joiner events: update event_date to profile joining_date ---
    await sql`
      UPDATE engage.feed_events
      SET event_date = p.joining_date
      FROM skillshub.profiles p
      WHERE engage.feed_events.event_type = 'new_joiner'
        AND p.user_id = engage.feed_events.user_id
        AND p.joining_date IS NOT NULL
        AND engage.feed_events.event_date IS DISTINCT FROM p.joining_date
    `;

    // --- d) New joiners (by profile joining_date, last 30 days) + XP ---
    const joiners = await sql`
      SELECT u.id, COALESCE(p.name, u.name) AS name, p.joining_date
      FROM skillshub.profiles p
      JOIN auth.users u ON u.id = p.user_id
      WHERE p.joining_date IS NOT NULL
        AND p.joining_date >= NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM engage.feed_events fe
          WHERE fe.event_type = 'new_joiner' AND fe.user_id = u.id
        )
    `;

    for (const row of joiners) {
      try {
        if (!row.id || !row.name) {
          skipped.push(`joiner ${row.id}: missing name`);
          continue;
        }
        const joinDate = row.joining_date?.toISOString?.()
          ? row.joining_date.toISOString().slice(0, 10)
          : String(row.joining_date).slice(0, 10);
        await createFeedEvent({
          eventType: "new_joiner",
          sourceApp: "engage",
          userId: row.id,
          title: `${row.name} just joined Engage!`,
          description: "Welcome them to the team",
          metadata: { sayHello: "Drop a comment to say hi!" },
          eventDate: joinDate,
        });
        await awardXP(row.id, "engage", "onboarding_completed");
        counts.joiners++;
      } catch (err) {
        skipped.push(`joiner ${row.id}: ${String(err)}`);
      }
    }

    return NextResponse.json({ ok: true, generated: counts, skipped: skipped.length, skippedDetails: skipped });
  } catch (err) {
    console.error("Feed generate error:", err);
    return NextResponse.json({ error: "Failed to generate feed events", detail: String(err) }, { status: 500 });
  }
}
