import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, email, name, avatar_url, role, created_at, updated_at
    FROM auth.users
    WHERE id = ${session.user.id}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: rows[0] });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const sanitized = name.trim().slice(0, 100);

  const rows = await sql`
    UPDATE auth.users
    SET name = ${sanitized}, updated_at = NOW()
    WHERE id = ${session.user.id}
    RETURNING id, email, name, avatar_url, role, created_at, updated_at
  `;

  return NextResponse.json({ user: rows[0] });
}
