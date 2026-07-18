import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT * FROM birthdayhub.employees WHERE id = ${params.id}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ employee: rows[0] });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const rows = await sql`
    UPDATE birthdayhub.employees
    SET name = ${name}, email = ${email}, department = ${department ?? null},
        birthday = ${birthday}, notes = ${notes ?? null}
    WHERE id = ${params.id}
    RETURNING *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ employee: rows[0] });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    DELETE FROM birthdayhub.employees WHERE id = ${params.id} RETURNING id
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
