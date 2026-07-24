import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getDirectoryProfiles } from "@/lib/skillshub/storage";
import { DirectoryGrid } from "@/components/skillshub/directory-grid";

export default async function EmployeesPage() {
  await requireSkillsHubRole("hr");
  const profiles = await getDirectoryProfiles();
  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div>
        <p className="eyebrow mb-3">Directory</p>
        <h1 className="display-xl">
          {profiles.length} {profiles.length === 1 ? "person" : "people"}
        </h1>
        <p className="mt-2 text-ink-500">
          All employee profiles, including those pending review.
        </p>
      </div>
      <DirectoryGrid profiles={profiles} />
    </div>
  );
}
