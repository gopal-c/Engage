import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProjectMembers, addProjectMember, removeProjectMember } from "@/lib/projectshub/storage";
import { isManagerRole, forbiddenResponse } from "@/lib/projectshub/auth";
import { createFeedEvent } from "@/lib/feed";
import { awardXP } from "@/lib/xp";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const members = await getProjectMembers(id);
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role_ = (session.user as { role?: string }).role;
  if (!isManagerRole(role_)) {
    return forbiddenResponse("Only managers, HR, and admins can add members");
  }

  const { id } = await params;
  const { userId, role } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const memberId = await addProjectMember(id, userId, role || "member", session.user.id);

    createFeedEvent({
      eventType: "project_assigned",
      sourceApp: "projectshub",
      userId,
      title: "Assigned to a project",
      metadata: { projectId: id, role: role || "member", assignedBy: session.user.id },
    }).catch(() => {});

    awardXP(userId, "projectshub", "project_joined").catch(() => {});

    return NextResponse.json({ ok: true, memberId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const delRole = (session.user as { role?: string }).role;
  if (!isManagerRole(delRole)) {
    return forbiddenResponse("Only managers, HR, and admins can remove members");
  }

  const { id } = await params;
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    await removeProjectMember(id, userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
