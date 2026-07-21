import { NextResponse } from "next/server";
import { getSkillsHubSession } from "@/lib/skillshub/session";
import { getProfile, getProfileByEmail, updateProfile } from "@/lib/skillshub/storage";
import { hasResumeData } from "@/lib/skillshub/domain";
import { extractProfileFromPdf, ExtractError } from "@/lib/skillshub/extract";
import { verifyPreApprovalUploadToken } from "@/lib/skillshub/upload-token";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData();

  // Auth: either a pre-approval upload token OR a logged-in session
  const token = form.get("token");
  let profileId: string | null = null;

  if (typeof token === "string" && token) {
    profileId = await verifyPreApprovalUploadToken(token);
    if (!profileId) {
      return NextResponse.json({ ok: false, error: "This upload link has expired." }, { status: 401 });
    }
  } else {
    const session = await getSkillsHubSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
    }
    const profile = await getProfileByEmail(session.email);
    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found." }, { status: 404 });
    }
    profileId = profile.id;
  }

  const profile = await getProfile(profileId);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "Profile not found." }, { status: 404 });
  }
  if (hasResumeData(profile)) {
    return NextResponse.json({ ok: false, error: "Resume already uploaded." }, { status: 409 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file uploaded." }, { status: 400 });
  }

  let extracted;
  try {
    extracted = await extractProfileFromPdf(new Uint8Array(await file.arrayBuffer()));
  } catch (err) {
    if (err instanceof ExtractError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: "Extraction failed." }, { status: 500 });
  }

  const updated = await updateProfile(profileId, {
    name: extracted.name || profile.name,
    city: extracted.city,
    seniority: extracted.seniority,
    yearsExperience: extracted.yearsExperience,
    skills: extracted.skills,
    projects: extracted.projects,
    education: extracted.education,
  });
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Couldn't save your resume." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profileId: updated.id });
}
