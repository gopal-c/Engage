import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleBookmark } from "@/lib/ideahub/storage";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await toggleBookmark(id, session.user.id);
    return NextResponse.json({ ok: true, bookmarked: result.bookmarked });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
