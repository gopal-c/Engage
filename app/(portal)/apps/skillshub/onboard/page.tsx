import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { ResumeUploadWrapper } from "@/components/skillshub/resume-upload-wrapper";

export default async function OnboardPage() {
  await requireSkillsHubRole("hr");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Onboard Employee</h1>
        <p className="text-sm text-muted-foreground">
          Upload a resume PDF. Our AI will extract the profile automatically.
        </p>
      </div>
      <ResumeUploadWrapper
        endpoint="/api/skillshub/employees"
        successRedirect="/apps/skillshub/review"
      />
    </div>
  );
}
