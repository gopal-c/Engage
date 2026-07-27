import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getProfileByEmail, getMilestonesByProfileId } from "@/lib/skillshub/storage";
import { MilestonesPanel } from "@/components/skillshub/milestones-panel";

export default async function MilestonesPage() {
  const session = await requireSkillsHubRole("employee");
  const profile = await getProfileByEmail(session.email);

  if (!profile) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="display-xl">Milestones & Achievements</h1>
        <div className="mt-6 rounded-lg border-l-4 border-amber bg-amber-soft p-4 shadow-1">
          <p className="text-sm font-medium text-foreground">
            Your profile hasn&apos;t been created yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please set up your profile first before adding milestones.
          </p>
        </div>
      </section>
    );
  }

  const milestones = await getMilestonesByProfileId(profile.id);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="display-xl mb-6">Milestones & Achievements</h1>
      <MilestonesPanel profileId={profile.id} initialMilestones={milestones} />
    </div>
  );
}
