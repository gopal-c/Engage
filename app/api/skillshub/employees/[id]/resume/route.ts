import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/skillshub/session";
import { getProfile, updateProfile } from "@/lib/skillshub/storage";
import { extractProfileFromPdf, ExtractError } from "@/lib/skillshub/extract";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await requireApiRole("hr");
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  const { id } = await params;

  const profile = await getProfile(id);
  if (!profile) {
    return NextResponse.json({ ok: false, error: "Profile not found." }, { status: 404 });
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

  const updated = await updateProfile(id, {
    name: extracted.name || profile.name,
    city: extracted.city,
    seniority: extracted.seniority,
    yearsExperience: extracted.yearsExperience,
    skills: extracted.skills,
    projects: extracted.projects,
    education: extracted.education,
    status: "pending",
  });
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Couldn't save the resume." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profileId: updated.id, updatedAt: updated.updatedAt });
}
