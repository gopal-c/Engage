import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getVote, upsertVote, removeVote, getVoteCounts } from "@/lib/ideahub/storage";
import { awardXP } from "@/lib/xp";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { voteType } = await request.json();

  if (voteType !== "up" && voteType !== "down") {
    return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });
  }

  const existing = await getVote(id, session.user.id);

  if (existing?.vote_type === voteType) {
    await removeVote(id, session.user.id);
  } else {
    await upsertVote(id, session.user.id, voteType);
    if (!existing) awardXP(session.user.id, "ideahub", "idea_upvoted").catch(() => {});
  }

  const counts = await getVoteCounts(id);
  const current = await getVote(id, session.user.id);

  return NextResponse.json({
    ok: true,
    netVotes: counts.up - counts.down,
    userVote: current?.vote_type ?? null,
  });
}
