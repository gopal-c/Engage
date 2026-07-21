import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import type {
  Profile, Milestone, Status, Seniority, Skill, Project, Education,
  MilestoneCreator, MilestoneCategory,
} from "./types";

function getSQL() {
  return neon(process.env.POSTGRES_URL!);
}

type Row = {
  id: string;
  user_id: string | null;
  status: Status;
  name: string;
  email: string;
  city: string;
  seniority: Seniority;
  years_experience: number;
  skills: Skill[] | null;
  projects: Project[] | null;
  education: Education[] | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  work_email: string | null;
  work_email_verified: boolean;
  work_email_verification_token: string | null;
  work_email_verification_expires_at: string | null;
  joining_date: string | null;
  date_of_birth: string | null;
};

type MilestoneRow = {
  id: string;
  profile_id: string;
  title: string;
  milestone_date: string;
  category: MilestoneCategory;
  created_by: MilestoneCreator;
  created_at: string;
  updated_at: string;
};

function toDateStr(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  if (s.length >= 10 && s[4] === "-") return s.slice(0, 10);
  return null;
}

function rowToProfile(r: Row): Profile {
  return {
    id: r.id,
    userId: r.user_id ?? null,
    status: r.status,
    name: r.name,
    email: r.email,
    city: r.city,
    seniority: r.seniority,
    yearsExperience: r.years_experience,
    skills: typeof r.skills === "string" ? JSON.parse(r.skills) : (r.skills ?? []),
    projects: typeof r.projects === "string" ? JSON.parse(r.projects) : (r.projects ?? []),
    education: typeof r.education === "string" ? JSON.parse(r.education) : (r.education ?? []),
    avatarUrl: r.avatar_url ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at ?? r.created_at,
    workEmail: r.work_email ?? null,
    workEmailVerified: r.work_email_verified ?? false,
    workEmailVerificationToken: r.work_email_verification_token ?? null,
    workEmailVerificationExpiresAt: r.work_email_verification_expires_at ?? null,
    joiningDate: toDateStr(r.joining_date),
    dateOfBirth: toDateStr(r.date_of_birth),
  };
}

function rowToMilestone(r: MilestoneRow): Milestone {
  return {
    id: r.id,
    profileId: r.profile_id,
    title: r.title,
    milestoneDate: toDateStr(r.milestone_date) ?? r.milestone_date,
    category: r.category ?? "achievement",
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ─────────── Profiles ─────────── */

export async function getProfiles(): Promise<Profile[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM skillshub.profiles ORDER BY created_at DESC` as Row[];
  return rows.map(rowToProfile);
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM skillshub.profiles WHERE id = ${id} LIMIT 1` as Row[];
  return rows[0] ? rowToProfile(rows[0]) : undefined;
}

export async function getProfileByEmail(email: string): Promise<Profile | undefined> {
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM skillshub.profiles WHERE lower(email) = ${email.toLowerCase()} ORDER BY created_at DESC LIMIT 1
  ` as Row[];
  return rows[0] ? rowToProfile(rows[0]) : undefined;
}

export async function getProfileByWorkEmail(workEmail: string): Promise<Profile | undefined> {
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM skillshub.profiles WHERE lower(work_email) = ${workEmail.toLowerCase()} LIMIT 1
  ` as Row[];
  return rows[0] ? rowToProfile(rows[0]) : undefined;
}

export async function getProfileByUserId(userId: string): Promise<Profile | undefined> {
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM skillshub.profiles WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1
  ` as Row[];
  return rows[0] ? rowToProfile(rows[0]) : undefined;
}

export async function getApprovedProfiles(): Promise<Profile[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM skillshub.profiles WHERE status = 'approved' ORDER BY created_at DESC
  ` as Row[];
  return rows.map(rowToProfile);
}

export async function getPendingProfiles(): Promise<Profile[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM skillshub.profiles
    WHERE status = 'pending' AND (work_email IS NULL OR work_email_verified = TRUE)
    ORDER BY created_at DESC
  ` as Row[];
  return rows.map(rowToProfile);
}

export async function getDirectoryProfiles(): Promise<Profile[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM skillshub.profiles
    WHERE status IN ('approved', 'pending')
    ORDER BY created_at DESC
  ` as Row[];
  return rows.map(rowToProfile);
}

export async function addProfile(
  input: Omit<Profile, "id" | "userId" | "status" | "createdAt" | "updatedAt" | "avatarUrl" | "workEmail" | "workEmailVerified" | "workEmailVerificationToken" | "workEmailVerificationExpiresAt" | "joiningDate" | "dateOfBirth">,
): Promise<Profile> {
  const sql = getSQL();
  const id = randomUUID();
  const rows = await sql`
    INSERT INTO skillshub.profiles (id, status, name, email, city, seniority, years_experience, skills, projects, education)
    VALUES (
      ${id}, 'pending', ${input.name}, ${input.email}, ${input.city}, ${input.seniority}, ${input.yearsExperience},
      ${JSON.stringify(input.skills)}::jsonb,
      ${JSON.stringify(input.projects)}::jsonb,
      ${JSON.stringify(input.education)}::jsonb
    )
    RETURNING *
  ` as Row[];
  return rowToProfile(rows[0]);
}

export async function updateProfile(
  id: string,
  patch: Partial<Omit<Profile, "id" | "createdAt" | "updatedAt">>,
): Promise<Profile | undefined> {
  const sql = getSQL();
  const sets: string[] = [];
  const values: unknown[] = [];
  const map: Record<string, string> = {
    name: "name", email: "email", city: "city", seniority: "seniority",
    yearsExperience: "years_experience", status: "status",
    skills: "skills", projects: "projects", education: "education",
    userId: "user_id",
    workEmail: "work_email", workEmailVerified: "work_email_verified",
    workEmailVerificationToken: "work_email_verification_token",
    workEmailVerificationExpiresAt: "work_email_verification_expires_at",
    joiningDate: "joining_date", dateOfBirth: "date_of_birth",
    avatarUrl: "avatar_url",
  };
  for (const [k, v] of Object.entries(patch)) {
    if (!(k in map) || v === undefined) continue;
    const col = map[k];
    values.push(["skills", "projects", "education"].includes(k) ? JSON.stringify(v) : v);
    sets.push(`${col} = $${values.length}${["skills", "projects", "education"].includes(k) ? "::jsonb" : ""}`);
  }
  if (sets.length === 0) return getProfile(id);
  sets.push("updated_at = NOW()");
  values.push(id);
  const query = `UPDATE skillshub.profiles SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING *`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = await (sql as any)(query, values) as Row[];
  return rows[0] ? rowToProfile(rows[0]) : undefined;
}

export async function updateAvatarByEmail(
  email: string,
  avatarUrl: string | null,
): Promise<Profile | undefined> {
  const sql = getSQL();
  const rows = await sql`
    UPDATE skillshub.profiles SET avatar_url = ${avatarUrl}
    WHERE lower(email) = ${email.toLowerCase()}
    RETURNING *
  ` as Row[];
  return rows[0] ? rowToProfile(rows[0]) : undefined;
}

export async function setProfileStatus(
  id: string,
  status: Status,
): Promise<Profile | undefined> {
  const sql = getSQL();
  const rows = await sql`
    UPDATE skillshub.profiles SET status = ${status}, updated_at = NOW() WHERE id = ${id} RETURNING *
  ` as Row[];
  return rows[0] ? rowToProfile(rows[0]) : undefined;
}

export async function deleteProfile(id: string): Promise<boolean> {
  const sql = getSQL();
  const rows = await sql`DELETE FROM skillshub.profiles WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

/* ─────────── Self-signup + work-email verification ─────────── */

export async function createOrRefreshSelfSignupProfile(
  workEmail: string,
  name: string,
  token: string,
  expiresAt: string,
  userId?: string,
): Promise<Profile> {
  const existing = await getProfileByEmail(workEmail);
  if (existing) {
    const updated = await updateProfile(existing.id, {
      name,
      email: workEmail,
      workEmail,
      workEmailVerified: false,
      workEmailVerificationToken: token,
      workEmailVerificationExpiresAt: expiresAt,
      status: "pending",
      ...(userId ? { userId } : {}),
    });
    return updated!;
  }

  const sql = getSQL();
  const id = randomUUID();
  const rows = await sql`
    INSERT INTO skillshub.profiles (
      id, user_id, status, name, email, city, seniority, years_experience,
      skills, projects, education,
      work_email, work_email_verified, work_email_verification_token, work_email_verification_expires_at
    )
    VALUES (
      ${id}, ${userId ?? null}, 'pending', ${name}, ${workEmail}, '', 'junior', 0,
      '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
      ${workEmail}, FALSE, ${token}, ${expiresAt}
    )
    RETURNING *
  ` as Row[];
  return rowToProfile(rows[0]);
}

export async function getProfileByWorkEmailToken(token: string): Promise<Profile | undefined> {
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM skillshub.profiles
    WHERE work_email_verification_token = ${token}
      AND work_email_verification_expires_at > NOW()
    LIMIT 1
  ` as Row[];
  return rows[0] ? rowToProfile(rows[0]) : undefined;
}

export async function verifyWorkEmail(profileId: string): Promise<Profile | undefined> {
  return updateProfile(profileId, {
    workEmailVerified: true,
    workEmailVerificationToken: null,
    workEmailVerificationExpiresAt: null,
  });
}

export async function isEmployeeApproved(email: string): Promise<boolean> {
  try {
    const sql = getSQL();
    const rows = await sql`
      SELECT status FROM skillshub.profiles
      WHERE lower(email) = ${email.toLowerCase()}
      ORDER BY created_at DESC
      LIMIT 1
    ` as Array<{ status: string }>;
    if (!rows[0]) return false;
    return rows[0].status === "approved";
  } catch {
    return true;
  }
}

/* ─────────── Milestones ─────────── */

export async function getMilestonesByProfileId(profileId: string): Promise<Milestone[]> {
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM skillshub.milestones WHERE profile_id = ${profileId} ORDER BY milestone_date DESC
  ` as MilestoneRow[];
  return rows.map(rowToMilestone);
}

export async function getMilestoneById(id: string): Promise<Milestone | undefined> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM skillshub.milestones WHERE id = ${id} LIMIT 1` as MilestoneRow[];
  return rows[0] ? rowToMilestone(rows[0]) : undefined;
}

export async function addMilestone(
  profileId: string,
  title: string,
  milestoneDate: string,
  createdBy: MilestoneCreator,
  category: MilestoneCategory = "achievement",
): Promise<Milestone> {
  const sql = getSQL();
  const id = randomUUID();
  const rows = await sql`
    INSERT INTO skillshub.milestones (id, profile_id, title, milestone_date, created_by, category)
    VALUES (${id}, ${profileId}, ${title}, ${milestoneDate}, ${createdBy}, ${category})
    RETURNING *
  ` as MilestoneRow[];
  return rowToMilestone(rows[0]);
}

export async function deleteMilestone(id: string): Promise<boolean> {
  const sql = getSQL();
  const rows = await sql`DELETE FROM skillshub.milestones WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

/* ─────────── Seed helpers ─────────── */

export async function getProfileCount(): Promise<number> {
  const sql = getSQL();
  const rows = await sql`SELECT COUNT(*)::int AS c FROM skillshub.profiles` as Array<{ c: number }>;
  return rows[0]?.c ?? 0;
}

export async function getMilestoneCount(): Promise<number> {
  const sql = getSQL();
  const rows = await sql`SELECT COUNT(*)::int AS c FROM skillshub.milestones` as Array<{ c: number }>;
  return rows[0]?.c ?? 0;
}

export async function seedProfile(input: {
  name: string;
  email: string;
  city: string;
  seniority: Seniority;
  yearsExperience: number;
  skills: Skill[];
  projects: Project[];
  education: Education[];
  joiningDate?: string;
  dateOfBirth?: string;
}): Promise<string> {
  const sql = getSQL();
  const id = randomUUID();
  await sql`
    INSERT INTO skillshub.profiles (id, status, name, email, city, seniority, years_experience, skills, projects, education, joining_date, date_of_birth)
    VALUES (
      ${id}, 'approved', ${input.name}, ${input.email}, ${input.city}, ${input.seniority}, ${input.yearsExperience},
      ${JSON.stringify(input.skills)}::jsonb,
      ${JSON.stringify(input.projects)}::jsonb,
      ${JSON.stringify(input.education)}::jsonb,
      ${input.joiningDate ?? null},
      ${input.dateOfBirth ?? null}
    )
  `;
  return id;
}

export async function seedMilestone(input: {
  profileId: string;
  title: string;
  milestoneDate: string;
  createdBy: MilestoneCreator;
  category: MilestoneCategory;
}): Promise<void> {
  const sql = getSQL();
  const id = randomUUID();
  await sql`
    INSERT INTO skillshub.milestones (id, profile_id, title, milestone_date, created_by, category)
    SELECT ${id}, ${input.profileId}, ${input.title}, ${input.milestoneDate}::date, ${input.createdBy}, ${input.category}
    WHERE NOT EXISTS (
      SELECT 1 FROM skillshub.milestones WHERE profile_id = ${input.profileId} AND title = ${input.title}
    )
  `;
}

export async function linkProfileToUser(profileEmail: string, userId: string): Promise<void> {
  const sql = getSQL();
  await sql`
    UPDATE skillshub.profiles SET user_id = ${userId}
    WHERE lower(email) = ${profileEmail.toLowerCase()} AND user_id IS NULL
  `;
}
