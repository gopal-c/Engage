import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/skillshub/session";
import { getProfile, getProfileByEmail, getMilestonesByProfileId, addMilestone } from "@/lib/skillshub/storage";
import type { MilestoneCategory } from "@/lib/skillshub/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES: MilestoneCategory[] = ["achievement", "promotion", "certification", "education", "milestone", "celebration", "other"];

export async function GET(req: Request) {
  const profileId = new URL(req.url).searchParams.get("profileId");
  if (!profileId) {
    return NextResponse.json({ ok: false, error: "profileId is required." }, { status: 400 });
  }

  const session = await requireApiRole("any");
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  if (session.role !== "hr") {
    const own = await getProfileByEmail(session.email);
    if (!own || own.id !== profileId) {
      return NextResponse.json({ ok: false, error: "You can only view your own milestones." }, { status: 403 });
    }
  }

  const milestones = await getMilestonesByProfileId(profileId);
  return NextResponse.json({ ok: true, milestones });
}

export async function POST(req: Request) {
  const session = await requireApiRole("any");
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });

  const body = (await req.json()) as Record<string, unknown>;
  const profileId = typeof body.profileId === "string" ? body.profileId : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const milestoneDate = typeof body.milestoneDate === "string" ? body.milestoneDate : "";
  const category = VALID_CATEGORIES.includes(body.category as MilestoneCategory) ? (body.category as MilestoneCategory) : "achievement";

  if (!profileId || !title || !milestoneDate) {
    return NextResponse.json({ ok: false, error: "profileId, title, and milestoneDate are required." }, { status: 400 });
  }

  if (session.role === "employee") {
    const own = await getProfileByEmail(session.email);
    if (!own || own.id !== profileId) {
      return NextResponse.json({ ok: false, error: "You can only add milestones to your own profile." }, { status: 403 });
    }
  } else {
    const profile = await getProfile(profileId);
    if (!profile) return NextResponse.json({ ok: false, error: "Profile not found." }, { status: 404 });
  }

  const milestone = await addMilestone(profileId, title, milestoneDate, session.role, category);
  return NextResponse.json({ ok: true, milestone });
}
