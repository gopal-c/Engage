import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { date_of_birth, bio, skip } = body;

  if (skip) {
    await sql`
      UPDATE auth.users
      SET profile_completed = true, updated_at = NOW()
      WHERE id = ${session.user.id}
    `;
    return NextResponse.json({ ok: true });
  }

  if (!date_of_birth) {
    return NextResponse.json({ error: "Date of birth is required" }, { status: 400 });
  }

  if (!bio || typeof bio !== "string" || bio.trim().length === 0) {
    return NextResponse.json({ error: "Bio is required" }, { status: 400 });
  }

  if (bio.length > 500) {
    return NextResponse.json({ error: "Bio must be 500 characters or less" }, { status: 400 });
  }

  await sql`
    UPDATE auth.users
    SET date_of_birth = ${date_of_birth},
        bio = ${bio.trim().slice(0, 500)},
        profile_completed = true,
        updated_at = NOW()
    WHERE id = ${session.user.id}
  `;

  return NextResponse.json({ ok: true });
}
