import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { roleLevel } from "@/lib/auth-guard";

const ALL_ROLES = ["group", "employee", "manager", "hr", "admin"] as const;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || roleLevel(session.user.role) < roleLevel("hr")) {
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
  if (!session?.user?.id || roleLevel(session.user.role) < roleLevel("hr")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, role } = body;

  if (!userId || !role) {
    return NextResponse.json(
      { error: "userId and role are required" },
      { status: 400 },
    );
  }

  if (!ALL_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `role must be one of: ${ALL_ROLES.join(", ")}` },
      { status: 400 },
    );
  }

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 },
    );
  }

  const myLevel = roleLevel(session.user.role);
  if (roleLevel(role) > myLevel) {
    return NextResponse.json(
      { error: "Cannot assign a role above your own" },
      { status: 403 },
    );
  }

  const target = await sql`SELECT role FROM auth.users WHERE id = ${userId}`;
  if (target.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (roleLevel(target[0].role as string) >= myLevel) {
    return NextResponse.json(
      { error: "Cannot modify a user at or above your role level" },
      { status: 403 },
    );
  }

  const rows = await sql`
    UPDATE auth.users
    SET role = ${role}, updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, email, name, role
  `;

  return NextResponse.json({ user: rows[0] });
}

const DEV_USERS: Record<string, string> = {
  "hr@valueaddsofttech.com": "demo123",
  "admin": "demo123",
};

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || roleLevel(session.user.role) < roleLevel("hr")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, password } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const myLevel = roleLevel(session.user.role);
  const target = await sql`SELECT id, role FROM auth.users WHERE id = ${userId}`;
  if (target.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (roleLevel(target[0].role as string) >= myLevel) {
    return NextResponse.json(
      { error: "Cannot delete a user at or above your role level" },
      { status: 403 },
    );
  }

  const callerEmail = session.user.email ?? "";
  const expectedPassword = DEV_USERS[callerEmail];
  if (!expectedPassword || password !== expectedPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  await sql`DELETE FROM engage.activity_feed WHERE user_id = ${userId}`;
  await sql`DELETE FROM engage.notifications WHERE user_id = ${userId}`;
  await sql`DELETE FROM engage.app_settings WHERE user_id = ${userId}`;
  await sql`UPDATE skillshub.profiles SET user_id = NULL WHERE user_id = ${userId}`;
  await sql`DELETE FROM auth.users WHERE id = ${userId}`;

  return NextResponse.json({ ok: true });
}
