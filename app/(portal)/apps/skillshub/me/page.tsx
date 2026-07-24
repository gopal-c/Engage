import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getProfileByEmail, getMilestonesByProfileId } from "@/lib/skillshub/storage";
import { hasResumeData } from "@/lib/skillshub/domain";
import { MeProfilePage } from "@/components/skillshub/me-profile-page";

export default async function MePage() {
  const session = await requireSkillsHubRole("employee");
  const profile = await getProfileByEmail(session.email);

  const hasData = profile ? hasResumeData(profile) : false;
  const milestones = profile ? await getMilestonesByProfileId(profile.id) : [];

  return (
    <div className="mx-auto max-w-4xl">
      <MeProfilePage
        profile={profile ?? null}
        milestones={milestones}
        hasResumeData={hasData}
        uploadEndpoint="/api/skillshub/me/upload-resume"
      />
    </div>
  );
}
