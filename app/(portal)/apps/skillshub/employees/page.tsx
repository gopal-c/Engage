import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getApprovedProfiles } from "@/lib/skillshub/storage";
import { DirectoryGrid } from "@/components/skillshub/directory-grid";

export default async function EmployeesPage() {
  await requireSkillsHubRole("hr");
  const profiles = await getApprovedProfiles();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Employee Directory</h1>
        <p className="text-sm text-muted-foreground">
          {profiles.length} approved {profiles.length === 1 ? "profile" : "profiles"}
        </p>
      </div>
      <DirectoryGrid profiles={profiles} />
    </div>
  );
}
