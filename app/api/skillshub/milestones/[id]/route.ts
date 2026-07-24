import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/skillshub/session";
import { getMilestoneById, getProfileByEmail, deleteMilestone } from "@/lib/skillshub/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireApiRole("any");
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  const { id } = await params;

  const milestone = await getMilestoneById(id);
  if (!milestone) {
    return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  }

  if (session.role === "employee") {
    const own = await getProfileByEmail(session.email);
    if (!own || own.id !== milestone.profileId) {
      return NextResponse.json({ ok: false, error: "You can't delete that milestone." }, { status: 403 });
    }
  }

  const ok = await deleteMilestone(id);
  if (!ok) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
