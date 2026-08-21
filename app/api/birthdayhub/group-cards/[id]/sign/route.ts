import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { signGroupCard } from "@/lib/feed";
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
  const message = (body.message as string)?.trim();

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  try {
    const signatureId = await signGroupCard(id, session.user.id, message.slice(0, 500));
    awardXP(session.user.id, "birthdayhub", "card_signed").catch(() => {});
    return NextResponse.json({ ok: true, signatureId });
  } catch (err) {
    console.error("Sign card error:", err);
    return NextResponse.json({ error: "Failed to sign card" }, { status: 500 });
  }
}
