import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, email, name, avatar_url, role, date_of_birth, bio, profile_completed, created_at, updated_at
    FROM auth.users
    WHERE id = ${session.user.id}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = rows[0];
  return NextResponse.json({
    user: {
      ...user,
      date_of_birth: user.date_of_birth ? String(user.date_of_birth).slice(0, 10) : null,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, date_of_birth, bio } = body;

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
  }

  if (bio !== undefined && typeof bio === "string" && bio.length > 500) {
    return NextResponse.json({ error: "Bio must be 500 characters or less" }, { status: 400 });
  }

  const sanitizedName = name ? name.trim().slice(0, 100) : undefined;
  const sanitizedBio = typeof bio === "string" ? bio.trim().slice(0, 500) : undefined;
  const dob = date_of_birth || null;

  const rows = await sql`
    UPDATE auth.users
    SET
      name = COALESCE(${sanitizedName ?? null}, name),
      date_of_birth = COALESCE(${dob}, date_of_birth),
      bio = COALESCE(${sanitizedBio ?? null}, bio),
      updated_at = NOW()
    WHERE id = ${session.user.id}
    RETURNING id, email, name, avatar_url, role, date_of_birth, bio, profile_completed, created_at, updated_at
  `;

  const user = rows[0];
  return NextResponse.json({
    user: {
      ...user,
      date_of_birth: user.date_of_birth ? String(user.date_of_birth).slice(0, 10) : null,
    },
  });
}
