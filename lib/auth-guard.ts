import { auth } from "./auth";
import { redirect } from "next/navigation";

export const ROLE_HIERARCHY: Record<string, number> = {
  admin: 40,
  hr: 30,
  manager: 20,
  employee: 10,
};

export function roleLevel(role: string): number {
  return ROLE_HIERARCHY[role] ?? 0;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(role: string) {
  const session = await requireAuth();
  if (roleLevel(session.user.role) < roleLevel(role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireHR() {
  return requireRole("hr");
}
