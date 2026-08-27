import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findMatchingUsers } from "@/lib/projectshub/skill-matcher";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requiredSkills, excludeUserIds } = await req.json();

  if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    return NextResponse.json({ error: "requiredSkills array is required" }, { status: 400 });
  }

  try {
    const matches = await findMatchingUsers(requiredSkills, { excludeUserIds });
    return NextResponse.json({ matches });
  } catch {
    return NextResponse.json({ matches: [] });
  }
}
