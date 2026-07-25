import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { roleLevel } from "@/lib/auth-guard";
import {
  getExcludedUsers,
  addExcludedUser,
  removeExcludedUser,
} from "@/lib/birthdayhub/storage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || roleLevel(session.user.role) < roleLevel("hr")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const excluded = await getExcludedUsers();
  return NextResponse.json(excluded);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || roleLevel(session.user.role) < roleLevel("hr")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, reason } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await addExcludedUser(userId, session.user.id, reason);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id || roleLevel(session.user.role) < roleLevel("hr")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await removeExcludedUser(userId);
  return NextResponse.json({ ok: true });
}
