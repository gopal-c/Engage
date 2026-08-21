import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleReaction } from "@/lib/feed";
import { awardXP } from "@/lib/xp";

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
  const reactionType = body.reactionType as "like" | "celebrate";

  if (!["like", "celebrate"].includes(reactionType)) {
    return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
  }

  try {
    const result = await toggleReaction(id, session.user.id, reactionType);

    if (result.added) {
      awardXP(session.user.id, "engage", "reaction_added").catch(() => {});
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Reaction error:", err);
    return NextResponse.json({ error: "Failed to toggle reaction" }, { status: 500 });
  }
}
