import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const year = searchParams.get("year") || new Date().getFullYear().toString();

  const rows = await sql`
    SELECT sl.*, e.email AS employee_email, e.department
    FROM birthdayhub.send_logs sl
    JOIN birthdayhub.employees e ON e.id = sl.employee_id
    WHERE sl.year = ${parseInt(year)}
    ORDER BY sl.sent_at DESC
  `;

  return NextResponse.json({ logs: rows });
}
