import { sql } from "@/lib/db";
import type { Employee, SendLog, ScheduledSend, AppSettings, ExcludedUser } from "./types";

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToEmployee(row: Record<string, unknown>): Employee {
  const raw = row.date_of_birth;
  let birthday = "";
  if (raw) {
    const dob = raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw);
    const m = dob.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) birthday = `${m[2]}-${m[3]}`;
  }
  return {
    id:        row.id as string,
    name:      row.name as string,
    email:     row.email as string,
    birthday,
    city:      (row.city as string) || "",
    seniority: (row.seniority as string) || "",
    avatarUrl: (row.avatar_url as string) || undefined,
  };
}

function rowToLog(row: Record<string, unknown>): SendLog {
  return {
    id:           row.id as string,
    employeeId:   row.employee_id as string,
    employeeName: row.employee_name as string,
    sentAt:       row.sent_at as string,
    year:         row.year as number,
    status:       row.status as "sent" | "failed",
    error:        (row.error as string) || undefined,
  };
}

function rowToScheduledSend(row: Record<string, unknown>): ScheduledSend {
  let cc: string[] = [];
  try {
    const raw = row.cc;
    if (Array.isArray(raw)) cc = raw as string[];
    else if (typeof raw === "string") cc = JSON.parse(raw);
  } catch { cc = []; }
  return {
    id:               row.id as string,
    employeeId:       row.employee_id as string,
    employeeName:     row.employee_name as string,
    employeeEmail:    row.employee_email as string,
    message:          (row.message as string) || "",
    gmailUser:        (row.gmail_user as string) || "",
    gmailAppPassword: (row.gmail_app_password as string) || "",
    fromName:         (row.from_name as string) || "The HR Team",
    cc,
    ccBehavior:       ((row.cc_behavior as string) || "cc") as ScheduledSend["ccBehavior"],
    mood:             (row.mood as string) || "Sunny",
    fuel:             (row.fuel as string) || "Coffee",
    heroImageUrl:     (row.hero_image_url as string) || undefined,
    paletteId:        (row.palette_id as string) || undefined,
    scheduledAt:      row.scheduled_at as string,
    status:           row.status as ScheduledSend["status"],
    createdAt:        (row.created_at as string) || new Date().toISOString(),
    sentAt:           (row.sent_at as string) || undefined,
  };
}

// ── Employees (read-only, merged from skillshub.profiles + auth.users) ──────

export async function getEmployees(): Promise<Employee[]> {
  const rows = await sql`
    SELECT DISTINCT ON (lower(email)) id, name, email, city, seniority, date_of_birth, avatar_url
    FROM (
      SELECT p.id, p.name, p.email, p.city, p.seniority, p.date_of_birth,
             COALESCE(p.avatar_url, u.avatar_url) AS avatar_url
      FROM skillshub.profiles p
      LEFT JOIN auth.users u ON lower(u.email) = lower(p.email)
      WHERE p.date_of_birth IS NOT NULL
      UNION ALL
      SELECT id, name, email, '' AS city, '' AS seniority, date_of_birth, avatar_url
      FROM auth.users
      WHERE date_of_birth IS NOT NULL
    ) combined
    ORDER BY lower(email), city DESC
  `;
  return rows.map(rowToEmployee);
}

export async function getEmployee(id: string): Promise<Employee | null> {
  // Check skillshub.profiles first, then auth.users
  const profileRows = await sql`
    SELECT id, name, email, city, seniority, date_of_birth
    FROM skillshub.profiles
    WHERE id = ${id} AND date_of_birth IS NOT NULL
  `;
  if (profileRows.length) return rowToEmployee(profileRows[0]);

  const userRows = await sql`
    SELECT id, name, email, '' AS city, '' AS seniority, date_of_birth
    FROM auth.users
    WHERE id = ${id} AND date_of_birth IS NOT NULL
  `;
  return userRows.length ? rowToEmployee(userRows[0]) : null;
}

// ── Send Logs ────────────────────────────────────────────────────────────────

export async function getLogs(): Promise<SendLog[]> {
  const rows = await sql`SELECT * FROM birthdayhub.send_logs ORDER BY sent_at DESC LIMIT 200`;
  return rows.map(rowToLog);
}

export async function appendLog(log: SendLog): Promise<void> {
  const existing = await sql`
    SELECT 1 FROM birthdayhub.send_logs
    WHERE employee_id = ${log.employeeId}
      AND year = ${log.year}
      AND status = 'sent'
    LIMIT 1
  `;
  if (existing.length > 0) return;
  await sql`
    INSERT INTO birthdayhub.send_logs (id, employee_id, employee_name, sent_at, year, status, error)
    VALUES (${log.id}, ${log.employeeId}, ${log.employeeName}, ${log.sentAt}, ${log.year}, ${log.status}, ${log.error || null})
  `;
}

export async function clearLogs(): Promise<void> {
  await sql`DELETE FROM birthdayhub.send_logs`;
}

// ── App Settings ─────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  fromName: process.env.GMAIL_FROM_NAME || "The HR Team",
  replyTo: "",
  autoSendEnabled: true,
  sendTimeIST: "09:00",
  sendTimeUTC: "03:30",
  cronExpression: "30 3 * * *",
  ccMode: "all",
  customCCList: [],
  bccOverride: true,
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await sql`SELECT value FROM birthdayhub.kv_store WHERE key = 'bh:settings'`;
  if (!rows.length) return { ...DEFAULT_SETTINGS };
  try {
    const val = rows[0].value;
    const parsed = typeof val === "string" ? JSON.parse(val) : val;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const value = JSON.stringify(settings);
  await sql`
    INSERT INTO birthdayhub.kv_store (key, value) VALUES ('bh:settings', ${value}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function todayMMDD(): string {
  const n = new Date();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${m}-${d}`;
}

export function alreadySentThisYear(logs: SendLog[], employeeId: string): boolean {
  const year = new Date().getFullYear();
  return logs.some(
    (l) => l.employeeId === employeeId && l.year === year && l.status === "sent"
  );
}

// ── Scheduled Sends ──────────────────────────────────────────────────────────

export async function createScheduledSend(job: ScheduledSend): Promise<void> {
  const ccJson = JSON.stringify(job.cc || []);
  const ccBehavior = job.ccBehavior || "cc";
  await sql`
    INSERT INTO birthdayhub.scheduled_sends
      (id, employee_id, employee_name, employee_email, message,
       gmail_user, gmail_app_password, from_name, cc, cc_behavior,
       mood, fuel, hero_image_url, palette_id,
       scheduled_at, status, created_at)
    VALUES
      (${job.id}, ${job.employeeId}, ${job.employeeName}, ${job.employeeEmail},
       ${job.message}, ${job.gmailUser}, ${job.gmailAppPassword}, ${job.fromName},
       ${ccJson}::jsonb, ${ccBehavior}, ${job.mood}, ${job.fuel},
       ${job.heroImageUrl || null}, ${job.paletteId || null},
       ${job.scheduledAt}, 'pending', ${job.createdAt})
  `;
}

export async function getScheduledSends(status = "pending"): Promise<ScheduledSend[]> {
  const rows = await sql`
    SELECT * FROM birthdayhub.scheduled_sends WHERE status = ${status} ORDER BY scheduled_at ASC
  `;
  return rows.map(rowToScheduledSend);
}

export async function getScheduledSend(id: string): Promise<ScheduledSend | null> {
  const rows = await sql`SELECT * FROM birthdayhub.scheduled_sends WHERE id = ${id}`;
  return rows.length ? rowToScheduledSend(rows[0]) : null;
}

export async function updateScheduledSendStatus(
  id: string,
  status: ScheduledSend["status"],
  sentAt?: string
): Promise<void> {
  await sql`
    UPDATE birthdayhub.scheduled_sends SET status = ${status}, sent_at = ${sentAt || null} WHERE id = ${id}
  `;
}

export async function getDueScheduledSends(): Promise<ScheduledSend[]> {
  const now = new Date().toISOString();
  const rows = await sql`
    SELECT * FROM birthdayhub.scheduled_sends
    WHERE status = 'pending' AND scheduled_at <= ${now}
    ORDER BY scheduled_at ASC
  `;
  return rows.map(rowToScheduledSend);
}

// ── Excluded Users ──────────────────────────────────────────────────────────

export async function getExcludedUsers(): Promise<ExcludedUser[]> {
  const rows = await sql`
    SELECT eu.id, eu.user_id, u.name, u.email, eu.reason,
           eb.name AS excluded_by_name, eu.created_at
    FROM birthdayhub.excluded_users eu
    JOIN auth.users u ON u.id = eu.user_id
    LEFT JOIN auth.users eb ON eb.id = eu.excluded_by
    ORDER BY eu.created_at DESC
  `;
  return rows.map((r) => ({
    id:             r.id as string,
    userId:         r.user_id as string,
    name:           r.name as string,
    email:          r.email as string,
    reason:         (r.reason as string) || undefined,
    excludedByName: (r.excluded_by_name as string) || undefined,
    createdAt:      (r.created_at as string) || new Date().toISOString(),
  }));
}

export async function addExcludedUser(
  userId: string,
  excludedBy: string,
  reason?: string
): Promise<void> {
  await sql`
    INSERT INTO birthdayhub.excluded_users (user_id, excluded_by, reason)
    VALUES (${userId}, ${excludedBy}, ${reason || null})
    ON CONFLICT (user_id) DO NOTHING
  `;
}

export async function removeExcludedUser(userId: string): Promise<void> {
  await sql`DELETE FROM birthdayhub.excluded_users WHERE user_id = ${userId}`;
}

export async function getExcludedUserIds(): Promise<Set<string>> {
  const rows = await sql`SELECT user_id FROM birthdayhub.excluded_users`;
  return new Set(rows.map((r) => r.user_id as string));
}

export async function getExcludedEmails(): Promise<Set<string>> {
  const rows = await sql`
    SELECT lower(u.email) AS email
    FROM birthdayhub.excluded_users eu
    JOIN auth.users u ON u.id = eu.user_id
  `;
  return new Set(rows.map((r) => r.email as string));
}

export async function isUserExcluded(userId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM birthdayhub.excluded_users WHERE user_id = ${userId} LIMIT 1
  `;
  return rows.length > 0;
}
