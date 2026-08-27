import { NextResponse } from "next/server";
import { isProjectMember } from "./storage";

const MANAGER_ROLES = ["admin", "hr", "manager"];

export function isManagerRole(role?: string): boolean {
  return MANAGER_ROLES.includes(role ?? "");
}

export async function canManageProject(
  userId: string,
  role: string | undefined,
  projectId: string
): Promise<boolean> {
  if (isManagerRole(role)) return true;
  return isProjectMember(projectId, userId);
}

export function forbiddenResponse(message = "Only managers, HR, and admins can perform this action") {
  return NextResponse.json({ error: message }, { status: 403 });
}
