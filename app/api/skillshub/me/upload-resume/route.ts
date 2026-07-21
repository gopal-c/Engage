import { NextResponse } from "next/server";
import { getProfileByEmail, updateProfile } from "@/lib/skillshub/storage";
import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { extractProfileFromPdf, ExtractError } from "@/lib/skillshub/extract";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireSkillsHubRole("employee");

  const existing = await getProfileByEmail(session.email);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "No profile exists for your account yet. Wait for HR to onboard you." }, { status: 404 });
  }

  let pdfBytes: Uint8Array;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file uploaded." }, { status: 400 });
    }
    pdfBytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return NextResponse.json({ ok: false, error: "Couldn't read the upload." }, { status: 400 });
  }

  let extracted;
  try {
    extracted = await extractProfileFromPdf(pdfBytes);
  } catch (err) {
    if (err instanceof ExtractError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: "Extraction failed." }, { status: 500 });
  }

  try {
    const updated = await updateProfile(existing.id, {
      name: extracted.name,
      city: extracted.city,
      seniority: extracted.seniority,
      yearsExperience: extracted.yearsExperience,
      skills: extracted.skills,
      projects: extracted.projects,
      education: extracted.education,
      status: "pending",
    });
    if (!updated) {
      return NextResponse.json({ ok: false, error: "Couldn't update your profile." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, profileId: updated.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "save failed";
    return NextResponse.json({ ok: false, error: `Couldn't save profile: ${message}` }, { status: 500 });
  }
}
