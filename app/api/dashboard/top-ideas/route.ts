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
      SELECT i.id, i.title, c.icon AS category_icon,
        (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'up')
        - (SELECT COUNT(*)::int FROM ideahub.votes v WHERE v.idea_id = i.id AND v.vote_type = 'down') AS net_votes
      FROM ideahub.ideas i
      LEFT JOIN ideahub.categories c ON c.id = i.category_id
      WHERE i.created_at >= date_trunc('month', NOW())
      ORDER BY net_votes DESC, i.created_at DESC
      LIMIT 5
    `;

    return NextResponse.json({ ideas: rows });
  } catch (err) {
    console.error("Top ideas API error:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
