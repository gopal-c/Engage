import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT * FROM engage.notifications
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 20
  `;

  const unreadCount = await sql`
    SELECT COUNT(*)::int AS count FROM engage.notifications
    WHERE user_id = ${session.user.id} AND read = false
  `;

  return NextResponse.json({
    notifications: rows,
    unreadCount: unreadCount[0].count,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, markAllRead } = body;

  if (markAllRead) {
    await sql`
      UPDATE engage.notifications SET read = true
      WHERE user_id = ${session.user.id} AND read = false
    `;
  } else if (id) {
    await sql`
      UPDATE engage.notifications SET read = true
      WHERE id = ${id} AND user_id = ${session.user.id}
    `;
  } else {
    return NextResponse.json({ error: "Provide id or markAllRead" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
