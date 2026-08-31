import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markChannelRead } from "@/lib/projectshub/storage";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ channelId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channelId } = await params;

  try {
    await markChannelRead(channelId, session.user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
