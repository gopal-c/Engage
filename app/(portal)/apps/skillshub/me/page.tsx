import { redirect } from "next/navigation";
import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getProfileByEmail, getMilestonesByProfileId } from "@/lib/skillshub/storage";
import { MePanel } from "@/components/skillshub/me-panel";

export default async function MePage() {
  const session = await requireSkillsHubRole("employee");
  const profile = await getProfileByEmail(session.email);
  if (!profile) redirect("/apps/skillshub/home");
  const milestones = await getMilestonesByProfileId(profile.id);
  return (
    <div className="mx-auto max-w-4xl">
      <MePanel profile={profile} milestones={milestones} />
    </div>
  );
}
