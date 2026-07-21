import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getPendingProfiles } from "@/lib/skillshub/storage";
import { DirectoryGrid } from "@/components/skillshub/directory-grid";

export default async function ReviewPage() {
  await requireSkillsHubRole("hr");
  const profiles = await getPendingProfiles();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Review</h1>
        <p className="text-sm text-muted-foreground">
          {profiles.length} {profiles.length === 1 ? "profile" : "profiles"} awaiting approval
        </p>
      </div>
      {profiles.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center">
          <p className="text-muted-foreground">No profiles pending review.</p>
        </div>
      ) : (
        <DirectoryGrid profiles={profiles} />
      )}
    </div>
  );
}
