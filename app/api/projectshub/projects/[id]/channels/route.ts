import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProjectChannels, createChannel } from "@/lib/projectshub/storage";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const channels = await getProjectChannels(id);
  return NextResponse.json({ channels });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
  }

  try {
    const channelId = await createChannel(id, name.trim());
    return NextResponse.json({ ok: true, channelId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
