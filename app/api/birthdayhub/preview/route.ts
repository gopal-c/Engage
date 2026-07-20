import { NextResponse } from "next/server";
import { buildEmailHTML, resolvePalette } from "@/lib/birthdayhub/email-template";
import { generateIllustrationUrl } from "@/lib/birthdayhub/generate-illustration";

export async function POST(req: Request) {
  const {
    name,
    department,
    message,
    fromName: bodyFromName,
    paletteId: inputPaletteId,
    mood,
    fuel,
    imageUrl: lockedImageUrl,
  } = await req.json();

  const fromName = bodyFromName || process.env.GMAIL_FROM_NAME || "The HR Team";
  const resolvedPalette = resolvePalette(inputPaletteId || undefined);
  const imageUrl = lockedImageUrl || generateIllustrationUrl();

  const html = buildEmailHTML(
    name || "",
    department || "",
    message || "",
    fromName,
    undefined,
    mood || "Sunny",
    fuel || "Coffee",
    undefined,
    imageUrl,
    resolvedPalette.id
  );

  return NextResponse.json({ html, imageUrl, paletteId: resolvedPalette.id });
}
