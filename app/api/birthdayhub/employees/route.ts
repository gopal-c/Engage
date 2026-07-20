import { NextResponse } from "next/server";
import { getEmployees, saveEmployees } from "@/lib/birthdayhub/storage";
import type { Employee } from "@/lib/birthdayhub/types";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const employees = await getEmployees();
  return NextResponse.json(employees);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, department, birthday, notes } = body;

  if (!name || !email || !birthday) {
    return NextResponse.json({ error: "name, email, and birthday are required" }, { status: 400 });
  }

  if (!/^\d{2}-\d{2}$/.test(birthday)) {
    return NextResponse.json({ error: "birthday must be MM-DD (e.g. 03-25)" }, { status: 400 });
  }

  const employee: Employee = {
    id: randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    department: (department || "").trim(),
    birthday,
    notes: notes?.trim(),
    createdAt: new Date().toISOString(),
  };

  const all = await getEmployees();
  all.push(employee);
  await saveEmployees(all);

  return NextResponse.json(employee, { status: 201 });
}
