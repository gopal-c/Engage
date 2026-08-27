import { sql } from "../db";

type SkillEntry = { name: string; level?: string };

type MatchResult = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  matchedSkills: string[];
  matchScore: number;
  seniority: string | null;
  department: string | null;
};

export async function findMatchingUsers(
  requiredSkills: string[],
  opts: { excludeUserIds?: string[]; limit?: number } = {}
): Promise<MatchResult[]> {
  if (requiredSkills.length === 0) return [];

  const rows = await sql`
    SELECT sp.user_id, sp.name, sp.email, sp.avatar_url, sp.skills, sp.seniority,
      (SELECT p.department FROM projectshub.projects p LIMIT 0) AS department
    FROM skillshub.profiles sp
    WHERE sp.user_id IS NOT NULL AND sp.status = 'approved'
  `;

  const normalizedRequired = requiredSkills.map((s) => s.toLowerCase().trim());
  const results: MatchResult[] = [];

  for (const row of rows as Record<string, unknown>[]) {
    const userId = row.user_id as string;
    if (opts.excludeUserIds?.includes(userId)) continue;

    const skills = (row.skills as SkillEntry[] | null) ?? [];
    const userSkillNames = skills.map((s) => (typeof s === "string" ? s : s.name).toLowerCase().trim());

    const matched = normalizedRequired.filter((req) =>
      userSkillNames.some((us) => us.includes(req) || req.includes(us))
    );

    if (matched.length === 0) continue;

    results.push({
      userId,
      name: (row.name as string) ?? "",
      email: (row.email as string) ?? "",
      avatarUrl: row.avatar_url as string | null,
      matchedSkills: matched,
      matchScore: Math.round((matched.length / normalizedRequired.length) * 100),
      seniority: row.seniority as string | null,
      department: null,
    });
  }

  results.sort((a, b) => b.matchScore - a.matchScore || b.matchedSkills.length - a.matchedSkills.length);
  return results.slice(0, opts.limit ?? 20);
}
