import { NextResponse } from "next/server";
import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { addProfile, getProfileByEmail } from "@/lib/skillshub/storage";
import { extractProfileFromPdf, ExtractError } from "@/lib/skillshub/extract";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await requireSkillsHubRole("hr");

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

  if (extracted.email) {
    const existing = await getProfileByEmail(extracted.email);
    if (existing) {
      return NextResponse.json(
        { ok: false, error: `A profile already exists for ${extracted.email}. The employee can refresh it via their own Update Resume page.` },
        { status: 409 },
      );
    }
  }

  try {
    const profile = await addProfile(extracted);
    return NextResponse.json({ ok: true, profileId: profile.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "save failed";
    return NextResponse.json({ ok: false, error: `Couldn't save profile: ${message}` }, { status: 500 });
  }
}
