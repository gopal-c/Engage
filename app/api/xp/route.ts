import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserLevel, getUserBadges, ALL_BADGES } from "@/lib/xp";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [level, badges] = await Promise.all([
      getUserLevel(session.user.id),
      getUserBadges(session.user.id),
    ]);

    return NextResponse.json({
      ...level,
      badges,
      allBadges: ALL_BADGES,
    });
  } catch (err) {
    console.error("XP API error:", err);
    return NextResponse.json({ error: "Failed to load XP" }, { status: 500 });
  }
}
