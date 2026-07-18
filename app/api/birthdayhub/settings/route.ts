import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT key, value FROM birthdayhub.settings
  `;

  const settings: Record<string, unknown> = {};
  for (const row of rows as { key: string; value: unknown }[]) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "hr") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { settings } = body;

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "settings object required" }, { status: 400 });
  }

  const validKeys = ["from_name", "auto_send", "cc_list", "bcc_list", "cron_time"];

  for (const [key, value] of Object.entries(settings)) {
    if (!validKeys.includes(key)) continue;
    await sql`
      INSERT INTO birthdayhub.settings (key, value)
      VALUES (${key}, ${JSON.stringify(value)})
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}
    `;
  }

  return NextResponse.json({ success: true });
}
