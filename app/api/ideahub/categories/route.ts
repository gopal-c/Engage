import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCategories, createCategory } from "@/lib/ideahub/storage";

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "hr") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { name, description, icon } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const category = await createCategory(name.trim(), description?.trim() || null, icon?.trim() || null);
    return NextResponse.json({ ok: true, category });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
