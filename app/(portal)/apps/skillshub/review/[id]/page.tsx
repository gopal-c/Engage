import { notFound } from "next/navigation";
import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getProfile, getMilestonesByProfileId } from "@/lib/skillshub/storage";
import { ProfileForm } from "@/components/skillshub/profile-form";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSkillsHubRole("hr");
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();
  const milestones = await getMilestonesByProfileId(id);
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review: {profile.name}</h1>
        <p className="text-sm text-muted-foreground">
          Status: <span className="capitalize">{profile.status}</span>
        </p>
      </div>
      <ProfileForm profile={profile} mode="review" initialMilestones={milestones} />
    </div>
  );
}
