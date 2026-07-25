import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserExcluded } from "@/lib/birthdayhub/storage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ excluded: false });
  }

  const excluded = await isUserExcluded(session.user.id);
  return NextResponse.json({ excluded });
}
