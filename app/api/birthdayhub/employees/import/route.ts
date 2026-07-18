import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { csv } = body;

  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ error: "csv string is required" }, { status: 400 });
  }

  const lines = csv.trim().split("\n");
  const header = lines[0].toLowerCase();

  const hasHeader = header.includes("name") && header.includes("email");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  let imported = 0;
  const errors: string[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i].trim();
    if (!line) continue;

    const parts = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
    const [name, email, department, birthday, notes] = parts;

    if (!name || !email || !birthday) {
      errors.push(`Row ${i + 1}: missing name, email, or birthday`);
      continue;
    }

    if (!/^\d{2}-\d{2}$/.test(birthday)) {
      errors.push(`Row ${i + 1}: birthday must be MM-DD format (got "${birthday}")`);
      continue;
    }

    try {
      await sql`
        INSERT INTO birthdayhub.employees (name, email, department, birthday, notes)
        VALUES (${name}, ${email}, ${department || null}, ${birthday}, ${notes || null})
      `;
      imported++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`Row ${i + 1}: ${msg}`);
    }
  }

  return NextResponse.json({ imported, errors, total: dataLines.length });
}
