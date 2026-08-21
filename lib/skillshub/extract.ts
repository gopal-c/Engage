import { extractText, getDocumentProxy } from "unpdf";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import type { Proficiency, Seniority } from "./types";

export type ExtractedProfile = {
  name: string;
  email: string;
  city: string;
  seniority: Seniority;
  yearsExperience: number;
  skills: Array<{ name: string; category: string; proficiency: Proficiency; yearsExperience: number }>;
  projects: Array<{ name: string; description: string; skillsUsed: string[]; duration: string }>;
  education: Array<{ degree: string; institution: string; year: number; month?: number }>;
};

export class ExtractError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ExtractError";
    this.status = status;
  }
}

const SYSTEM_PROMPT = `You are a careful resume parser. Read the resume text and return a JSON object that fits this exact shape:

{
  "name": string,
  "email": string,
  "city": string,
  "seniority": "junior" | "mid" | "senior" | "lead",
  "yearsExperience": number,
  "skills": [{ "name": string, "category": string, "proficiency": "beginner" | "intermediate" | "advanced" | "expert", "yearsExperience": number }],
  "projects": [{ "name": string, "description": string, "skillsUsed": string[], "duration": string }],
  "education": [{ "degree": string, "institution": string, "year": number, "month": number | null }]
}

Guidance:
- "category" examples: language, framework, database, cloud, tool, domain, soft.
- Infer "seniority" from years of experience: 0–2 junior, 3–5 mid, 6–9 senior, 10+ lead.
- Infer "proficiency" from how recent and central the skill is in projects.
- If a field is missing, make a reasonable guess; never invent specifics like company names.
- Return JSON only — no prose, no markdown.`;

const VALID_SENIORITY: Seniority[] = ["junior", "mid", "senior", "lead"];
const VALID_PROFICIENCY: Proficiency[] = ["beginner", "intermediate", "advanced", "expert"];

function coerce(raw: unknown): ExtractedProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const name = typeof r.name === "string" ? r.name : "";
  const email = typeof r.email === "string" ? r.email : "";
  const city = typeof r.city === "string" ? r.city : "";
  const seniority = VALID_SENIORITY.includes(r.seniority as Seniority) ? (r.seniority as Seniority) : "mid";
  const yearsExperience = typeof r.yearsExperience === "number" ? r.yearsExperience : 0;
  if (!name) return null;

  const skills = Array.isArray(r.skills) ? r.skills.flatMap((s: unknown) => {
    if (!s || typeof s !== "object") return [];
    const sx = s as Record<string, unknown>;
    if (typeof sx.name !== "string") return [];
    return [{
      name: sx.name,
      category: typeof sx.category === "string" ? sx.category : "other",
      proficiency: VALID_PROFICIENCY.includes(sx.proficiency as Proficiency) ? (sx.proficiency as Proficiency) : "intermediate",
      yearsExperience: typeof sx.yearsExperience === "number" ? sx.yearsExperience : 0,
    }];
  }) : [];

  const projects = Array.isArray(r.projects) ? r.projects.flatMap((p: unknown) => {
    if (!p || typeof p !== "object") return [];
    const px = p as Record<string, unknown>;
    if (typeof px.name !== "string") return [];
    return [{
      name: px.name,
      description: typeof px.description === "string" ? px.description : "",
      skillsUsed: Array.isArray(px.skillsUsed) ? px.skillsUsed.filter((x): x is string => typeof x === "string") : [],
      duration: typeof px.duration === "string" ? px.duration : "",
    }];
  }) : [];

  const education = Array.isArray(r.education) ? r.education.flatMap((e: unknown) => {
    if (!e || typeof e !== "object") return [];
    const ex = e as Record<string, unknown>;
    if (typeof ex.degree !== "string") return [];
    return [{
      degree: ex.degree,
      institution: typeof ex.institution === "string" ? ex.institution : "",
      year: typeof ex.year === "number" ? ex.year : 0,
      month: typeof ex.month === "number" && ex.month >= 1 && ex.month <= 12 ? ex.month : undefined,
    }];
  }) : [];

  return { name, email, city, seniority, yearsExperience, skills, projects, education };
}

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export async function extractProfileFromPdf(buffer: Uint8Array | Buffer): Promise<ExtractedProfile> {
  if (!process.env.GROQ_API_KEY) {
    throw new ExtractError("GROQ_API_KEY not configured.", 503);
  }
  if (buffer.length > MAX_RESUME_BYTES) {
    throw new ExtractError("That PDF is too large — we support up to 10 MB.", 413);
  }

  let resumeText: string;
  try {
    const pdf = await getDocumentProxy(buffer as Uint8Array);
    const result = await extractText(pdf, { mergePages: true });
    resumeText = Array.isArray(result.text) ? result.text.join("\n") : result.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : "PDF parsing failed";
    throw new ExtractError(`PDF parsing failed: ${message}`, 422);
  }
  if (!resumeText.trim()) {
    throw new ExtractError("We couldn't read any text from that PDF. Is it scanned?", 422);
  }

  let parsed: unknown;
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Resume text:\n\n${resumeText.slice(0, 18000)}` },
      ],
    });
    parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
  } catch (err) {
    const message = err instanceof Error ? err.message : "extraction failed";
    throw new ExtractError(`Extraction failed: ${message}`, 502);
  }

  const extracted = coerce(parsed);
  if (!extracted) {
    throw new ExtractError("We couldn't pull a structured profile out of that resume.", 422);
  }
  return extracted;
}
