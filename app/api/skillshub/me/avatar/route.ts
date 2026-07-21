import { NextResponse } from "next/server";
import { getSkillsHubSession } from "@/lib/skillshub/session";
import { getProfileByEmail, updateAvatarByEmail } from "@/lib/skillshub/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LEN = 700_000;

export async function PATCH(req: Request) {
  const session = await getSkillsHubSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
  }
  if (session.role !== "employee") {
    return NextResponse.json({ ok: false, error: "Employees only." }, { status: 403 });
  }

  let body: { avatar?: unknown };
  try {
    body = (await req.json()) as { avatar?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  const avatar = body.avatar;

  if (avatar !== null) {
    if (typeof avatar !== "string") {
      return NextResponse.json({ ok: false, error: "Avatar must be a string or null." }, { status: 400 });
    }
    if (!avatar.startsWith("data:image/")) {
      return NextResponse.json({ ok: false, error: "Avatar must be a data:image/* URL." }, { status: 400 });
    }
    if (avatar.length > MAX_LEN) {
      return NextResponse.json({ ok: false, error: "Image too large — try something under ~500KB." }, { status: 413 });
    }
  }

  const existing = await getProfileByEmail(session.email);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Upload your resume first to create a profile." }, { status: 404 });
  }

  const updated = await updateAvatarByEmail(session.email, avatar as string | null);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Couldn't save photo." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, avatar_url: updated.avatarUrl });
}
