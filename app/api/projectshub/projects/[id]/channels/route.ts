import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProjectChannels, createChannel, renameChannel, deleteChannel } from "@/lib/projectshub/storage";
import { isManagerRole, forbiddenResponse } from "@/lib/projectshub/auth";

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

  const role = (session.user as { role?: string }).role;
  if (!isManagerRole(role)) {
    return forbiddenResponse("Only managers, HR, and admins can create channels");
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!isManagerRole(role)) {
    return forbiddenResponse("Only managers, HR, and admins can rename channels");
  }

  await params;
  const { channelId, name } = await req.json();

  if (!channelId || !name?.trim()) {
    return NextResponse.json({ error: "channelId and name are required" }, { status: 400 });
  }

  const ok = await renameChannel(channelId, name.trim());
  if (!ok) {
    return NextResponse.json({ error: "Channel not found or cannot rename General" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (!isManagerRole(role)) {
    return forbiddenResponse("Only managers, HR, and admins can delete channels");
  }

  await params;
  const { channelId } = await req.json();

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  const ok = await deleteChannel(channelId);
  if (!ok) {
    return NextResponse.json({ error: "Channel not found or cannot delete General" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
