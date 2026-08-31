import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProject, updateProject, deleteProject, getProjectMembers, getProjectMilestones, getProjectChannels, isProjectMember } from "@/lib/projectshub/storage";
import { isManagerRole, forbiddenResponse } from "@/lib/projectshub/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [members, milestones, channels] = await Promise.all([
      getProjectMembers(id),
      getProjectMilestones(id),
      getProjectChannels(id),
    ]);

    const role = (session.user as { role?: string }).role;
    const canManage = ["admin", "hr", "manager"].includes(role ?? "");
    const memberCheck = await isProjectMember(id, session.user.id);

    return NextResponse.json({ project, members, milestones, channels, canManage, isMember: memberCheck || canManage });
  } catch {
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!isManagerRole(role)) {
    return forbiddenResponse("Only managers, HR, and admins can update projects");
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const ok = await updateProject(id, body);
    if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!["admin", "hr"].includes(role ?? "")) {
    return forbiddenResponse("Only HR and admins can delete projects");
  }

  const { id } = await params;

  try {
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
