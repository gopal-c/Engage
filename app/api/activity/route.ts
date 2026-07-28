import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { neon } from "@neondatabase/serverless";
import { logActivity } from "@/lib/activity";

function getClient() {
  return neon(process.env.POSTGRES_URL!);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const sourceApp = searchParams.get("source");
  const offset = (page - 1) * limit;

  const deletedFilter = `
    AND (
      af.source_app != 'ideahub'
      OR af.metadata->>'ideaId' IS NULL
      OR EXISTS (SELECT 1 FROM ideahub.ideas i WHERE i.id::text = af.metadata->>'ideaId')
    )
  `;

  const client = getClient();
  let rows;
  if (sourceApp && ["ideahub", "skillshub", "birthdayhub", "engage"].includes(sourceApp)) {
    rows = await client.query(
      `SELECT af.*, u.name AS user_name, u.avatar_url AS user_avatar
       FROM engage.activity_feed af
       JOIN auth.users u ON u.id = af.user_id
       WHERE af.source_app = $1 ${deletedFilter}
       ORDER BY af.created_at DESC
       LIMIT $2 OFFSET $3`,
      [sourceApp, limit, offset],
    );
  } else {
    rows = await client.query(
      `SELECT af.*, u.name AS user_name, u.avatar_url AS user_avatar
       FROM engage.activity_feed af
       JOIN auth.users u ON u.id = af.user_id
       WHERE true ${deletedFilter}
       ORDER BY af.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
  }

  return NextResponse.json({ items: rows, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sourceApp, eventType, title, description, metadata } = body;

  if (!sourceApp || !eventType || !title) {
    return NextResponse.json(
      { error: "sourceApp, eventType, and title are required" },
      { status: 400 }
    );
  }

  await logActivity({
    userId: session.user.id,
    sourceApp,
    eventType,
    title,
    description,
    metadata,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
