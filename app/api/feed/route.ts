import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFeedEvents } from "@/lib/feed";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const page = Number(params.get("page")) || 1;
  const limit = Math.min(Number(params.get("limit")) || 20, 50);

  try {
    const result = await getFeedEvents({ page, limit, userId: session.user.id });
    return NextResponse.json({ ...result, currentUserId: session.user.id, currentUserName: session.user.name ?? "You", currentUserAvatar: session.user.image ?? null });
  } catch (err) {
    console.error("Feed API error:", err);
    return NextResponse.json({ error: "Failed to load feed" }, { status: 500 });
  }
}
