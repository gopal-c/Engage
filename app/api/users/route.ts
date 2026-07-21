import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !["admin", "hr"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await sql`
    SELECT id, email, name, avatar_url, role, created_at, updated_at
    FROM auth.users
    ORDER BY created_at DESC
  `;

  return NextResponse.json({
    users: rows,
    currentUserId: session.user.id,
    currentUserRole: session.user.role,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json(
      { error: "userId and role are required" },
      { status: 400 }
    );
  }

  const validRoles = ["employee", "hr", "admin"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: `role must be one of: ${validRoles.join(", ")}` },
      { status: 400 }
    );
  }

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  const rows = await sql`
    UPDATE auth.users
    SET role = ${role}, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, name, role
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: rows[0] });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM auth.users WHERE id = ${userId}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await sql`DELETE FROM engage.activity_feed WHERE user_id = ${userId}`;
  await sql`DELETE FROM engage.notifications WHERE user_id = ${userId}`;
  await sql`DELETE FROM engage.app_settings WHERE user_id = ${userId}`;
  await sql`UPDATE skillshub.profiles SET user_id = NULL WHERE user_id = ${userId}`;
  await sql`UPDATE birthdayhub.employees SET user_id = NULL WHERE user_id = ${userId}`;
  await sql`DELETE FROM auth.users WHERE id = ${userId}`;

  return NextResponse.json({ ok: true });
}
