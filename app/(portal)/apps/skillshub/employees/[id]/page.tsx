import { notFound } from "next/navigation";
import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getProfile } from "@/lib/skillshub/storage";
import { ProfileView } from "@/components/skillshub/profile-view";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSkillsHubRole("hr");
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();
  return (
    <div className="mx-auto max-w-4xl py-4">
      <ProfileView profile={profile} canManage />
    </div>
  );
}
