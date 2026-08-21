import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await sql`
      SELECT m.id, m.title, m.milestone_date, m.category
      FROM skillshub.milestones m
      JOIN skillshub.profiles p ON p.id = m.profile_id
      WHERE p.user_id = ${session.user.id}
      ORDER BY m.milestone_date DESC
      LIMIT 5
    `;

    return NextResponse.json({ milestones: rows });
  } catch (err) {
    console.error("My milestones API error:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
