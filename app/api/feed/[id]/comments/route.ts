import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addFeedComment, getFeedComments } from "@/lib/feed";
import { awardXP } from "@/lib/xp";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const comments = await getFeedComments(id);
  return NextResponse.json({ comments });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const text = (body.body as string)?.trim();

  if (!text) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }

  try {
    const comment = await addFeedComment(id, session.user.id, text.slice(0, 2000));
    awardXP(session.user.id, "engage", "comment_posted").catch(() => {});
    return NextResponse.json({ ok: true, comment });
  } catch (err) {
    console.error("Comment error:", err);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
