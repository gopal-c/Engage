import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getIdea, updateIdea, deleteIdea, getVote, getVoteCounts, isBookmarked } from "@/lib/ideahub/storage";
import { logActivity } from "@/lib/activity";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const idea = await getIdea(id);
  if (!idea) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "admin" || role === "hr";
  const isAuthor = idea.authorId === session.user.id;

  const [userVoteRow, bookmarked] = await Promise.all([
    getVote(id, session.user.id),
    isBookmarked(id, session.user.id),
  ]);

  const masked = {
    ...idea,
    authorId: isAdmin ? idea.authorId : undefined,
    authorName: idea.isAnonymous && !isAdmin && !isAuthor ? null : idea.authorName,
    authorAvatar: idea.isAnonymous && !isAdmin && !isAuthor ? null : idea.authorAvatar,
    isAuthor,
    isAdmin,
    userVote: userVoteRow?.vote_type ?? null,
    isBookmarked: bookmarked,
  };

  return NextResponse.json({ idea: masked });
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const idea = await getIdea(id);
  if (!idea) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "admin" || role === "hr";
  const isAuthor = idea.authorId === session.user.id;

  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const patch: Record<string, unknown> = {};

  if (isAuthor) {
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.categoryId !== undefined) patch.categoryId = body.categoryId;
    if (body.isAnonymous !== undefined) patch.isAnonymous = body.isAnonymous;
  }

  if (isAdmin && body.status !== undefined) {
    const validStatuses = ["open", "under_review", "approved", "implemented", "declined"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status;

    await logActivity({
      userId: session.user.id,
      sourceApp: "ideahub",
      eventType: "idea_status_changed",
      title: `Idea status changed to ${body.status}`,
      description: idea.title,
      metadata: { ideaId: id, oldStatus: idea.status, newStatus: body.status },
    }).catch(() => {});
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: true, idea });
  }

  const updated = await updateIdea(id, patch);
  return NextResponse.json({ ok: true, idea: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const idea = await getIdea(id);
  if (!idea) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "admin" || role === "hr";
  const isAuthor = idea.authorId === session.user.id;

  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteIdea(id);
  return NextResponse.json({ ok: true });
}
