import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { togglePin, getPinnedMessages } from "@/lib/projectshub/storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId } = await params;
  const pinned = await getPinnedMessages(channelId);
  return NextResponse.json({ pinned });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messageId } = await req.json();
  if (!messageId) {
    return NextResponse.json({ error: "messageId is required" }, { status: 400 });
  }

  try {
    const pinned = await togglePin(messageId);
    return NextResponse.json({ ok: true, pinned });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
