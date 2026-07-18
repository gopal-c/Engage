import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateBirthdayMessage } from "@/lib/birthdayhub/groq";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, department, notes } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const message = await generateBirthdayMessage(name, department, notes);
    return NextResponse.json({ message });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `AI generation failed: ${msg}` }, { status: 500 });
  }
}
