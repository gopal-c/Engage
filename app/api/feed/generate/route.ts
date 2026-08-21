import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { createFeedEvent, createGroupCard } from "@/lib/feed";

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

    const counts = { ideas: 0, birthdays: 0, milestones: 0, joiners: 0 };

    // --- a) Ideas -> idea_shared events ---
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
      counts.ideas++;
    }

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
    }

    // --- c) Milestones / certifications ---
    const milestones = await sql`
      SELECT m.id, m.title, m.milestone_date, m.category, p.user_id
      FROM skillshub.milestones m
      JOIN skillshub.profiles p ON p.id = m.profile_id
      WHERE NOT EXISTS (
        SELECT 1 FROM engage.feed_events fe
        WHERE fe.event_type IN ('milestone', 'certification')
          AND fe.metadata->>'milestoneId' = m.id::text
      )
      ORDER BY m.milestone_date DESC
      LIMIT 50
    `;

    for (const row of milestones) {
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
      counts.milestones++;
    }

    // --- d) New joiners (last 30 days) ---
    const joiners = await sql`
      SELECT u.id, u.name, u.created_at
      FROM auth.users u
      WHERE u.created_at >= NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
          SELECT 1 FROM engage.feed_events fe
          WHERE fe.event_type = 'new_joiner' AND fe.user_id = u.id
        )
    `;

    for (const row of joiners) {
      await createFeedEvent({
        eventType: "new_joiner",
        sourceApp: "engage",
        userId: row.id,
        title: `${row.name} just joined Engage!`,
        description: "Welcome them to the team",
        metadata: { sayHello: "Drop a comment to say hi!" },
        eventDate: row.created_at?.toISOString?.()
          ? row.created_at.toISOString().slice(0, 10)
          : String(row.created_at).slice(0, 10),
      });
      counts.joiners++;
    }

    return NextResponse.json({ ok: true, generated: counts });
  } catch (err) {
    console.error("Feed generate error:", err);
    return NextResponse.json({ error: "Failed to generate feed events" }, { status: 500 });
  }
}
