import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserProjects } from "@/lib/projectshub/storage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const projects = await getUserProjects(session.user.id);
    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ projects: [] });
  }
}
