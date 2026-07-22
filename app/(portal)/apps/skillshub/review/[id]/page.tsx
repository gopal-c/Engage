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
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      <div>
        <p className="eyebrow mb-3">Review</p>
        <h1 className="display-xl">{profile.name}</h1>
        <p className="mt-2 text-ink-500">
          Status:{" "}
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
            profile.status === "pending"
              ? "border-coral/25 bg-coral-soft text-coral-deep"
              : "border-teal/25 bg-teal-soft text-teal-deep"
          }`}>
            <span className={`size-1.5 rounded-full ${profile.status === "pending" ? "bg-coral-deep" : "bg-teal-deep"}`} />
            {profile.status}
          </span>
        </p>
      </div>
      <ProfileForm profile={profile} mode="review" initialMilestones={milestones} />
    </div>
  );
}
