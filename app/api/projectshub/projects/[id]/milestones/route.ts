import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProjectMilestones, createMilestone, updateMilestone, deleteMilestone } from "@/lib/projectshub/storage";
import { createFeedEvent } from "@/lib/feed";
import { awardXP } from "@/lib/xp";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const milestones = await getProjectMilestones(id);
  return NextResponse.json({ milestones });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { title, description, targetDate } = await req.json();

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const milestoneId = await createMilestone(id, { title: title.trim(), description, targetDate });
    return NextResponse.json({ ok: true, milestoneId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { milestoneId, title, description, targetDate, status } = await req.json();

  if (!milestoneId) {
    return NextResponse.json({ error: "milestoneId is required" }, { status: 400 });
  }

  try {
    await updateMilestone(milestoneId, { title, description, targetDate, status });

    if (status === "completed") {
      createFeedEvent({
        eventType: "project_milestone_completed",
        sourceApp: "projectshub",
        userId: session.user.id,
        title: `Milestone completed: ${title ?? ""}`,
        metadata: { milestoneId },
      }).catch(() => {});

      awardXP(session.user.id, "projectshub", "project_milestone_done").catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { milestoneId } = await req.json();
  if (!milestoneId) {
    return NextResponse.json({ error: "milestoneId is required" }, { status: 400 });
  }

  try {
    await deleteMilestone(milestoneId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
