import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT id, user_id, name, email, department, birthday, notes, created_at
    FROM birthdayhub.employees
    ORDER BY birthday ASC, name ASC
  `;

  return NextResponse.json({ employees: rows });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, department, birthday, notes } = body;

  if (!name || !email || !birthday) {
    return NextResponse.json(
      { error: "name, email, and birthday (MM-DD) are required" },
      { status: 400 }
    );
  }

  if (!/^\d{2}-\d{2}$/.test(birthday)) {
    return NextResponse.json(
      { error: "birthday must be in MM-DD format" },
      { status: 400 }
    );
  }

  const rows = await sql`
    INSERT INTO birthdayhub.employees (name, email, department, birthday, notes)
    VALUES (${name}, ${email}, ${department ?? null}, ${birthday}, ${notes ?? null})
    RETURNING *
  `;

  return NextResponse.json({ employee: rows[0] }, { status: 201 });
}
