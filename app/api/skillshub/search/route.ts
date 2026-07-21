import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getApprovedProfiles } from "@/lib/skillshub/storage";
import type { Profile } from "@/lib/skillshub/types";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are SkillsHub's hiring assistant.

The user asks a question in plain English (e.g. "Who knows React AND has worked on payment integrations?"). You see a numbered list of candidate profiles with their skills, projects, and background.

For every candidate that's a meaningful match, return:
- "index": the candidate's number from the list
- "score": integer 0-100 indicating match strength
- "reason": one short sentence (max ~25 words) citing concrete evidence — actual skill names, project names, years, or domain experience that match the query

Rules:
- Be specific in the reason. Say "shipped a Razorpay checkout flow," not "has payment experience."
- Score 90+ only for candidates who clearly satisfy every part of the query.
- Score 60-89 for partial matches (e.g. has most of the skills, in the right seniority).
- Score 40-59 for adjacent matches worth surfacing.
- Skip candidates below 40.
- Sort results by score descending.
- Return at most 8 candidates.
- Return JSON only — no prose, no markdown.

Output shape: { "results": [ { "index": number, "score": number, "reason": string } ] }`;

type LLMResult = { index: number; score: number; reason: string };

function compactProfile(p: Profile, idx: number) {
  return {
    idx,
    name: p.name,
    seniority: p.seniority,
    city: p.city,
    years: p.yearsExperience,
    skills: p.skills.map((s) => ({ name: s.name, proficiency: s.proficiency, years: s.yearsExperience })),
    projects: p.projects.map((pr) => ({ name: pr.name, description: pr.description, skills: pr.skillsUsed, duration: pr.duration })),
    education: p.education.map((e) => `${e.degree} @ ${e.institution} (${e.month ? `${new Date(2000, e.month - 1).toLocaleString("en-US", { month: "short" })} ` : ""}${e.year})`),
  };
}

export async function POST(req: Request) {
  await requireSkillsHubRole("hr");

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ ok: false, error: "GROQ_API_KEY not configured." }, { status: 503 });
  }

  let query: string;
  try {
    const body = (await req.json()) as { query?: string };
    query = (body.query ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ ok: false, error: "Type a question first." }, { status: 400 });
  }

  let profiles: Profile[];
  try {
    profiles = await getApprovedProfiles();
  } catch (err) {
    const message = err instanceof Error ? err.message : "DB error";
    return NextResponse.json({ ok: false, error: `Couldn't load profiles: ${message}` }, { status: 500 });
  }

  if (profiles.length === 0) {
    return NextResponse.json({ ok: true, query, results: [] });
  }

  const numbered = profiles.map((p, i) => compactProfile(p, i));

  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });

  let rawResults: LLMResult[] = [];
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Candidates (numbered):\n${JSON.stringify(numbered, null, 2)}\n\nQuery: ${query}`,
        },
      ],
    });
    const content = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content) as { results?: unknown };
    if (Array.isArray(parsed.results)) {
      rawResults = parsed.results.flatMap((r): LLMResult[] => {
        if (!r || typeof r !== "object") return [];
        const rx = r as Record<string, unknown>;
        if (typeof rx.index !== "number" || typeof rx.score !== "number" || typeof rx.reason !== "string") return [];
        return [{ index: rx.index, score: rx.score, reason: rx.reason }];
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "ranking failed";
    return NextResponse.json({ ok: false, error: `Search failed: ${message}` }, { status: 502 });
  }

  const hydrated = rawResults
    .flatMap((r) => {
      const profile = profiles[r.index];
      if (!profile) return [];
      const score = Math.max(0, Math.min(100, Math.round(r.score)));
      return [{ profile, score, reason: r.reason }];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return NextResponse.json({ ok: true, query, results: hydrated });
}
