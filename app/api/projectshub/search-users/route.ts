import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isManagerRole } from "@/lib/projectshub/auth";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!isManagerRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const pattern = `%${q}%`;
  const rows = await sql`
    SELECT id, name, email, avatar_url
    FROM auth.users
    WHERE (name ILIKE ${pattern} OR email ILIKE ${pattern})
    ORDER BY name ASC
    LIMIT 10
  `;

  return NextResponse.json({ users: rows });
}
