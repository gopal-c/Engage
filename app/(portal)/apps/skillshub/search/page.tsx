import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { SearchPanel } from "@/components/skillshub/search-panel";

export default async function SearchPage() {
  await requireSkillsHubRole("hr");
  return (
    <div className="mx-auto max-w-4xl space-y-10 py-8">
      <div>
        <p className="eyebrow-indigo mb-3">Search</p>
        <h1 className="display-xl">
          Find the right person, <span className="serif-italic text-indigo">in plain English.</span>
        </h1>
        <p className="mt-4 text-lg text-ink-500">
          Ask a question the way you&apos;d ask a teammate. We&apos;ll rank
          candidates and tell you why each one matched.
        </p>
      </div>
      <SearchPanel />
    </div>
  );
}
