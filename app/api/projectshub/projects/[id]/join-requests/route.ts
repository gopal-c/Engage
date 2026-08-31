import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createJoinRequest, getJoinRequests, getUserJoinRequest, reviewJoinRequest, addProjectMember, getPendingRequestCount } from "@/lib/projectshub/storage";
import { isManagerRole } from "@/lib/projectshub/auth";
import { sql } from "@/lib/db";
import { awardXP } from "@/lib/xp";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const role = (session.user as { role?: string }).role;

  if (isManagerRole(role)) {
    const requests = await getJoinRequests(id);
    const count = await getPendingRequestCount(id);
    return NextResponse.json({ requests, pendingCount: count });
  }

  const myRequest = await getUserJoinRequest(id, session.user.id);
  return NextResponse.json({ myRequest });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  try {
    const requestId = await createJoinRequest(id, session.user.id, body.message);
    if (!requestId) {
      return NextResponse.json({ error: "Request already pending" }, { status: 409 });
    }
    return NextResponse.json({ ok: true, requestId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!isManagerRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { requestId, action } = await req.json();

  if (!requestId || !["approved", "rejected"].includes(action)) {
    return NextResponse.json({ error: "requestId and action (approved/rejected) required" }, { status: 400 });
  }

  const result = await reviewJoinRequest(requestId, action, session.user.id);
  if (!result) {
    return NextResponse.json({ error: "Request not found or already reviewed" }, { status: 404 });
  }

  if (action === "approved") {
    await addProjectMember(id, result.user_id, "member", session.user.id);
    awardXP(result.user_id, "projectshub", "project_joined").catch(() => {});

    sql`INSERT INTO engage.notifications (user_id, source_app, title, body, link)
        VALUES (${result.user_id}, 'projectshub', ${"Your join request was approved!"}, ${"You've been added to the project team."}, ${`/apps/projectshub`})`.catch(() => {});
  } else {
    sql`INSERT INTO engage.notifications (user_id, source_app, title, body, link)
        VALUES (${result.user_id}, 'projectshub', ${"Your join request was declined"}, ${null}, ${`/apps/projectshub`})`.catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
