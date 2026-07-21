import { redirect } from "next/navigation";
import { requireSkillsHubSession } from "@/lib/skillshub/session";

export default async function SkillsHubPage() {
  const session = await requireSkillsHubSession();
  redirect(session.role === "hr" ? "/apps/skillshub/search" : "/apps/skillshub/home");
}
