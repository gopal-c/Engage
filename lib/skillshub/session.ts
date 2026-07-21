import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProfileByEmail, linkProfileToUser } from "./storage";

export type SkillsHubRole = "hr" | "employee";

export type SkillsHubSession = {
  userId: string;
  email: string;
  name: string;
  role: SkillsHubRole;
};

function mapRole(engageRole: string): SkillsHubRole {
  return engageRole === "admin" ? "hr" : "employee";
}

export async function getSkillsHubSession(): Promise<SkillsHubSession | null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  return {
    userId: session.user.id!,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    role: mapRole(session.user.role ?? "user"),
  };
}

export async function requireSkillsHubSession(): Promise<SkillsHubSession> {
  const session = await getSkillsHubSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireSkillsHubRole(role: SkillsHubRole | "any"): Promise<SkillsHubSession> {
  const session = await requireSkillsHubSession();
  if (role !== "any" && session.role !== role) {
    redirect(session.role === "hr" ? "/apps/skillshub/search" : "/apps/skillshub/home");
  }

  if (session.role === "employee") {
    const profile = await getProfileByEmail(session.email);
    if (profile && !profile.userId) {
      await linkProfileToUser(session.email, session.userId).catch(() => {});
    }
  }

  return session;
}
