import { NextResponse } from "next/server";
import { getEmployee, upsertEmployee, deleteEmployee } from "@/lib/birthdayhub/storage";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const existing = await getEmployee(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = { ...existing, ...body, id: existing.id, createdAt: existing.createdAt };

  if (updated.birthday && !/^\d{2}-\d{2}$/.test(updated.birthday)) {
    return NextResponse.json({ error: "birthday must be MM-DD" }, { status: 400 });
  }

  await upsertEmployee(updated);
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await deleteEmployee(params.id);
  return NextResponse.json({ ok: true });
}
