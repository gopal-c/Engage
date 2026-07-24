import { notFound } from "next/navigation";
import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getProfile, getMilestonesByProfileId, syncAvatarFromAuth } from "@/lib/skillshub/storage";
import { ProfileForm } from "@/components/skillshub/profile-form";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSkillsHubRole("hr");
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  if (!profile.avatarUrl) {
    const synced = await syncAvatarFromAuth(profile.id, profile.email).catch(() => null);
    if (synced) profile.avatarUrl = synced;
  }
  const milestones = await getMilestonesByProfileId(id);
  return (
    <div className="mx-auto max-w-4xl py-8">
      <ProfileForm profile={profile} mode="review" initialMilestones={milestones} />
    </div>
  );
}
