import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { SearchPanel } from "@/components/skillshub/search-panel";

export default async function SearchPage() {
  await requireSkillsHubRole("hr");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Search</h1>
        <p className="text-sm text-muted-foreground">
          Ask a question in plain English to find matching employee profiles.
        </p>
      </div>
      <SearchPanel />
    </div>
  );
}
