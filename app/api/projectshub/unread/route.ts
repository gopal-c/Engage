import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadCounts } from "@/lib/projectshub/storage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const unread = await getUnreadCounts(session.user.id);
    return NextResponse.json({ unread });
  } catch {
    return NextResponse.json({ unread: {} });
  }
}
