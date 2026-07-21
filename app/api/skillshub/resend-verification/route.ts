import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getProfileByEmail, updateProfile } from "@/lib/skillshub/storage";
import { sendVerificationEmail } from "@/lib/skillshub/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const GENERIC_MESSAGE = "If that email needs verifying, we've sent a new link.";

export async function POST(req: Request) {
  let email: string;
  try {
    const body = (await req.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
  }

  const profile = await getProfileByEmail(email);
  if (!profile || !profile.workEmail || profile.workEmailVerified) {
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE, emailSent: false });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
  await updateProfile(profile.id, {
    workEmailVerificationToken: token,
    workEmailVerificationExpiresAt: expiresAt,
  });

  const result = await sendVerificationEmail(email, profile.name, token);
  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE, emailSent: result.ok });
}
