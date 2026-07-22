import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getPendingProfiles } from "@/lib/skillshub/storage";
import { DirectoryGrid } from "@/components/skillshub/directory-grid";

export default async function ReviewPage() {
  await requireSkillsHubRole("hr");
  const profiles = await getPendingProfiles();
  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div>
        <p className="eyebrow-coral mb-3">Review Queue</p>
        <h1 className="display-xl">
          {profiles.length} pending {profiles.length === 1 ? "profile" : "profiles"}
        </h1>
        <p className="mt-2 text-ink-500">
          Newly uploaded resumes land here. Approve, reject, or edit before they go
          live in the directory.
        </p>
      </div>
      {profiles.length === 0 ? (
        <div className="glass-surface rounded-2xl border border-white/70 px-8 py-14 text-center shadow-2">
          <p className="eyebrow mb-2">All clear</p>
          <h3>No profiles pending review.</h3>
        </div>
      ) : (
        <DirectoryGrid profiles={profiles} />
      )}
    </div>
  );
}
