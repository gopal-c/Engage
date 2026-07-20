import { sql } from "@/lib/db";
import type { Employee, SendLog, ScheduledSend, AppSettings } from "./types";

// ── Row mappers ───────────────────────────────────────────────────────────────
function rowToEmployee(row: Record<string, unknown>): Employee {
  return {
    id:         row.id as string,
    name:       row.name as string,
    email:      row.email as string,
    department: (row.department as string) || "",
    birthday:   row.birthday as string,
    notes:      (row.notes as string) || undefined,
    createdAt:  (row.created_at as string) || new Date().toISOString(),
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

// ── Employees ────────────────────────────────────────────────────────────────

export async function getEmployees(): Promise<Employee[]> {
  const rows = await sql`SELECT * FROM birthdayhub.employees ORDER BY created_at ASC`;
  return rows.map(rowToEmployee);
}

export async function saveEmployees(employees: Employee[]): Promise<void> {
  await sql`DELETE FROM birthdayhub.employees`;
  for (const e of employees) {
    await sql`
      INSERT INTO birthdayhub.employees (id, name, email, department, birthday, notes, created_at)
      VALUES (${e.id}, ${e.name}, ${e.email}, ${e.department || null}, ${e.birthday}, ${e.notes || null}, ${e.createdAt || null})
    `;
  }
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const rows = await sql`SELECT * FROM birthdayhub.employees WHERE id = ${id}`;
  return rows.length ? rowToEmployee(rows[0]) : null;
}

export async function upsertEmployee(employee: Employee): Promise<void> {
  await sql`
    INSERT INTO birthdayhub.employees (id, name, email, department, birthday, notes, created_at)
    VALUES (${employee.id}, ${employee.name}, ${employee.email}, ${employee.department || null}, ${employee.birthday}, ${employee.notes || null}, ${employee.createdAt || null})
    ON CONFLICT (id) DO UPDATE SET
      name       = EXCLUDED.name,
      email      = EXCLUDED.email,
      department = EXCLUDED.department,
      birthday   = EXCLUDED.birthday,
      notes      = EXCLUDED.notes,
      created_at = EXCLUDED.created_at
  `;
}

export async function deleteEmployee(id: string): Promise<void> {
  await sql`DELETE FROM birthdayhub.employees WHERE id = ${id}`;
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
