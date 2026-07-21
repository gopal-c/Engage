export const WORK_EMAIL_DOMAIN = "@valueaddsofttech.com";

export function isAllowedWorkEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(WORK_EMAIL_DOMAIN);
}

export function hasResumeData(profile: { skills: unknown[]; projects: unknown[] }): boolean {
  return profile.skills.length > 0 || profile.projects.length > 0;
}

export function maxDateOfBirth(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 16);
  return d.toISOString().slice(0, 10);
}

export function isValidDateOfBirth(dob: string): boolean {
  if (!dob) return true;
  return dob <= maxDateOfBirth();
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00` : dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
