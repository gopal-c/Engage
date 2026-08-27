import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProjects, createProject, addProjectMember } from "@/lib/projectshub/storage";
import { createFeedEvent } from "@/lib/feed";
import { awardXP } from "@/lib/xp";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const opts = {
    status: params.get("status") || undefined,
    department: params.get("department") || undefined,
    search: params.get("search") || undefined,
  };

  try {
    const projects = await getProjects(opts);
    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ projects: [] });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!["admin", "hr", "manager"].includes(role ?? "")) {
    return NextResponse.json({ error: "Only managers, HR, and admins can create projects" }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, department, requiredSkills, startDate, endDate, status } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  try {
    const projectId = await createProject({
      name: name.trim(),
      description: description?.trim() || undefined,
      status: status || "planning",
      department: department?.trim() || undefined,
      requiredSkills: requiredSkills || [],
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      createdBy: session.user.id,
    });

    await addProjectMember(projectId, session.user.id, "lead", session.user.id);

    createFeedEvent({
      eventType: "project_launched",
      sourceApp: "projectshub",
      userId: session.user.id,
      title: `New project: ${name.trim()}`,
      description: description?.trim()?.slice(0, 200) || undefined,
      metadata: { projectId },
    }).catch(() => {});

    awardXP(session.user.id, "projectshub", "project_created").catch(() => {});

    return NextResponse.json({ ok: true, projectId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
