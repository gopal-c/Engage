import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getIdeas, createIdea } from "@/lib/ideahub/storage";
import { enrichIdea, scoreIdea, findSimilarIdeas } from "@/lib/ideahub/ai";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const mine = params.get("mine") === "true";

  const opts = {
    page: Number(params.get("page")) || 1,
    limit: Math.min(Number(params.get("limit")) || 12, 50),
    category: params.get("category") || undefined,
    status: params.get("status") || undefined,
    sort: (params.get("sort") as "trending" | "newest" | "most_voted") || "trending",
    search: params.get("search") || undefined,
    authorId: mine ? session.user.id : undefined,
  };

  try {
    const result = await getIdeas(opts);
    const role = (session.user as { role?: string }).role;
    const isAdmin = role === "admin" || role === "hr";

    const ideas = result.ideas.map((idea) => ({
      ...idea,
      authorId: isAdmin ? idea.authorId : undefined,
      authorName: idea.isAnonymous && !isAdmin && idea.authorId !== session.user!.id ? null : idea.authorName,
      authorAvatar: idea.isAnonymous && !isAdmin && idea.authorId !== session.user!.id ? null : idea.authorAvatar,
    }));

    return NextResponse.json({ ideas, total: result.total });
  } catch {
    return NextResponse.json({ ideas: [], total: 0 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, categoryId, isAnonymous, enrich, submit } = body;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }

  if (enrich && !submit) {
    try {
      const [enrichment, scores, existingResult] = await Promise.all([
        enrichIdea(title.trim(), description.trim()),
        scoreIdea(title.trim(), description.trim()),
        (async () => {
          const existing = await getIdeas({ limit: 50, sort: "newest" });
          return findSimilarIdeas(title.trim(), description.trim(), existing.ideas.map((i) => ({
            id: i.id, title: i.title, description: i.description,
          })));
        })(),
      ]);

      return NextResponse.json({
        ok: true,
        enrichment,
        scores,
        similar: existingResult.similar,
      });
    } catch {
      return NextResponse.json({
        ok: true,
        enrichment: null,
        scores: null,
        similar: [],
      });
    }
  }

  try {
    const idea = await createIdea({
      title: title.trim(),
      description: description.trim(),
      categoryId: categoryId || null,
      authorId: session.user.id,
      isAnonymous: isAnonymous ?? true,
      aiEnrichment: body.aiEnrichment || null,
      impactScore: body.impactScore || null,
      feasibilityScore: body.feasibilityScore || null,
    });

    await logActivity({
      userId: session.user.id,
      sourceApp: "ideahub",
      eventType: "idea_submitted",
      title: `New idea: ${title.trim()}`,
      description: isAnonymous ? "An anonymous idea was submitted" : undefined,
      metadata: { ideaId: idea.id },
    }).catch(() => {});

    return NextResponse.json({ ok: true, idea });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
