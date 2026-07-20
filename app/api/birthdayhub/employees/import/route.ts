import { NextResponse } from "next/server";
import { getEmployees, saveEmployees } from "@/lib/birthdayhub/storage";
import type { Employee } from "@/lib/birthdayhub/types";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const body = await req.json();
  const rows: Record<string, string>[] = body.rows;

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "rows must be a non-empty array" }, { status: 400 });
  }

  const errors: string[] = [];
  const imported: Employee[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = (row.name || row.Name || "").trim();
    const email = (row.email || row.Email || "").trim().toLowerCase();
    const department = (row.department || row.Department || row.dept || row.Dept || "").trim();
    const rawBd = (row.birthday || row.Birthday || row.dob || row.DOB || row["Date of Birth"] || "").trim();
    const notes = (row.notes || row.Notes || "").trim();

    if (!name || !email || !rawBd) {
      errors.push(`Row ${i + 2}: missing name, email, or birthday`);
      continue;
    }

    const birthday = parseBirthday(rawBd);
    if (!birthday) {
      errors.push(`Row ${i + 2}: unrecognized birthday format "${rawBd}"`);
      continue;
    }

    imported.push({
      id: randomUUID(),
      name,
      email,
      department,
      birthday,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    });
  }

  if (imported.length > 0) {
    const existing = await getEmployees();
    const existingEmails = new Set(existing.map((e) => e.email));
    const fresh = imported.filter((e) => !existingEmails.has(e.email));
    const skipped = imported.length - fresh.length;
    await saveEmployees([...existing, ...fresh]);
    return NextResponse.json({ imported: fresh.length, skipped, errors });
  }

  return NextResponse.json({ imported: 0, skipped: 0, errors }, { status: 400 });
}

function parseBirthday(raw: string): string | null {
  if (/^\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?$/);
  if (slash) {
    return String(parseInt(slash[1])).padStart(2, "0") + "-" + String(parseInt(slash[2])).padStart(2, "0");
  }

  const isoFull = raw.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (isoFull) return `${isoFull[1]}-${isoFull[2]}`;

  const months: Record<string, string> = {
    january:"01",february:"02",march:"03",april:"04",may:"05",june:"06",
    july:"07",august:"08",september:"09",october:"10",november:"11",december:"12",
    jan:"01",feb:"02",mar:"03",apr:"04",jun:"06",jul:"07",aug:"08",
    sep:"09",oct:"10",nov:"11",dec:"12",
  };
  const nm = raw.toLowerCase().match(/^([a-z]+)\s+(\d{1,2})(?:[, ]+\d{2,4})?$/);
  if (nm && months[nm[1]]) {
    return `${months[nm[1]]}-${String(parseInt(nm[2])).padStart(2, "0")}`;
  }
  const mn = raw.toLowerCase().match(/^(\d{1,2})\s+([a-z]+)(?:[, ]+\d{2,4})?$/);
  if (mn && months[mn[2]]) {
    return `${months[mn[2]]}-${String(parseInt(mn[1])).padStart(2, "0")}`;
  }

  return null;
}
