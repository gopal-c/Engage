import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getComments, createComment, deleteComment } from "@/lib/ideahub/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const role = (session.user as { role?: string }).role;
  const isAdmin = role === "admin" || role === "hr";

  try {
    const raw = await getComments(id);
    const comments = raw.map((c) => ({
      id: c.id,
      body: c.body,
      authorName: c.isAnonymous && !isAdmin && c.userId !== session.user!.id ? null : c.userName,
      authorAvatar: c.isAnonymous && !isAdmin && c.userId !== session.user!.id ? null : c.userAvatar,
      isAnonymous: c.isAnonymous,
      parentId: c.parentId,
      reactions: c.reactions,
      createdAt: c.createdAt,
      isOwn: c.userId === session.user!.id,
    }));
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ comments: [] });
  }
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { body, isAnonymous, parentId } = await request.json();

  if (!body?.trim()) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }

  try {
    const comment = await createComment({
      ideaId: id,
      userId: session.user.id,
      body: body.trim(),
      isAnonymous: isAnonymous ?? true,
      parentId: parentId || null,
    });
    return NextResponse.json({ ok: true, comment });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId } = await request.json();
  if (!commentId) {
    return NextResponse.json({ error: "commentId required" }, { status: 400 });
  }

  try {
    await deleteComment(commentId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
