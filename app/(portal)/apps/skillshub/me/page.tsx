import { redirect } from "next/navigation";
import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getProfileByEmail, getMilestonesByProfileId } from "@/lib/skillshub/storage";
import { hasResumeData } from "@/lib/skillshub/domain";
import { MeProfilePage } from "@/components/skillshub/me-profile-page";

export default async function MePage() {
  const session = await requireSkillsHubRole("employee");
  const profile = await getProfileByEmail(session.email);
  if (!profile) redirect("/apps/skillshub/home");

  const hasData = hasResumeData(profile);
  const milestones = await getMilestonesByProfileId(profile.id);

  const uploadEndpoint = hasData
    ? "/api/skillshub/me/upload-resume"
    : "/api/skillshub/verify-upload";

  return (
    <div className="mx-auto max-w-4xl">
      <MeProfilePage
        profile={profile}
        milestones={milestones}
        hasResumeData={hasData}
        uploadEndpoint={uploadEndpoint}
      />
    </div>
  );
}
