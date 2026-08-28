import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChannelMessages, sendMessage, getChannelProjectId, isProjectMember, getProjectMembers, getProject } from "@/lib/projectshub/storage";
import { awardXP } from "@/lib/xp";
import { sql } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId } = await params;
  const page = Number(req.nextUrl.searchParams.get("page")) || 1;
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 50, 100);

  try {
    const result = await getChannelMessages(channelId, { page, limit });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ messages: [], total: 0 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId } = await params;
  const { body, parentId } = await req.json();

  if (!body?.trim()) {
    return NextResponse.json({ error: "Message body is required" }, { status: 400 });
  }

  const projectId = await getChannelProjectId(channelId);
  if (!projectId) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const isMember = await isProjectMember(projectId, session.user.id);
  if (!isMember) {
    return NextResponse.json({ error: "You must be a project member to send messages" }, { status: 403 });
  }

  try {
    const messageId = await sendMessage(channelId, session.user.id, body.trim(), parentId);
    awardXP(session.user.id, "projectshub", "project_message_sent").catch(() => {});

    // Notify other project members
    Promise.all([getProjectMembers(projectId), getProject(projectId)]).then(([members, project]) => {
      const senderName = session.user?.name ?? "Someone";
      const projectName = project?.name ?? "a project";
      const otherMembers = members.filter((m) => m.userId !== session.user!.id);
      const preview = body.trim().length > 80 ? body.trim().slice(0, 80) + "..." : body.trim();
      return Promise.all(otherMembers.map((m) =>
        sql`INSERT INTO engage.notifications (user_id, source_app, title, body, link)
            VALUES (${m.userId}, 'projectshub', ${`${senderName} sent a message in ${projectName}`}, ${preview}, ${`/apps/projectshub/${projectId}`})`
      ));
    }).catch(() => {});

    return NextResponse.json({ ok: true, messageId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
