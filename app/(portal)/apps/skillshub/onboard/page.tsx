import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { ResumeUploadWrapper } from "@/components/skillshub/resume-upload-wrapper";

export default async function OnboardPage() {
  await requireSkillsHubRole("hr");
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-coral" />
          <span className="eyebrow-coral font-semibold">Step 1 · Upload</span>
        </span>
        <span className="text-ink-300">—</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-ink-300" />
          <span className="eyebrow">Step 2 · Extract</span>
        </span>
        <span className="text-ink-300">—</span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-ink-300" />
          <span className="eyebrow">Step 3 · Review</span>
        </span>
      </div>

      <div>
        <h1 className="display-xl">Onboard new employee.</h1>
        <p className="mt-3 text-lg text-ink-500">
          Upload their resume. We&apos;ll extract skills, projects, and experience.
          You&apos;ll review before it goes live.
        </p>
      </div>

      <ResumeUploadWrapper
        endpoint="/api/skillshub/employees"
        successRedirect="/apps/skillshub/review"
      />

      {/* Pipeline steps */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
        <span className="font-medium text-ink-700">What happens next</span>
        <span className="text-ink-300">→</span>
        <span className="rounded-full border border-ink-200/80 bg-ink-0/60 px-3 py-1 font-mono text-xs">
          AI extracts the profile
        </span>
        <span className="text-ink-300">→</span>
        <span className="rounded-full border border-ink-200/80 bg-ink-0/60 px-3 py-1 font-mono text-xs">
          You review in the queue
        </span>
        <span className="text-ink-300">→</span>
        <span className="rounded-full border border-ink-200/80 bg-ink-0/60 px-3 py-1 font-mono text-xs">
          Approved &amp; searchable
        </span>
      </div>
    </div>
  );
}
