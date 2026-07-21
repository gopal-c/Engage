import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getProfileByEmail } from "@/lib/skillshub/storage";
import { hasResumeData } from "@/lib/skillshub/domain";
import { ResumeUploadWrapper } from "@/components/skillshub/resume-upload-wrapper";

export default async function UploadPage() {
  const session = await requireSkillsHubRole("employee");
  const profile = await getProfileByEmail(session.email);

  const hasResume = profile && hasResumeData(profile);
  const endpoint = hasResume ? "/api/skillshub/me/upload-resume" : "/api/skillshub/verify-upload";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{hasResume ? "Update Resume" : "Upload Resume"}</h1>
        <p className="text-sm text-muted-foreground">
          {hasResume
            ? "Upload a new resume to update your profile. This will reset your profile to pending review."
            : "Upload your resume PDF. Our AI will extract your profile automatically."}
        </p>
      </div>
      <ResumeUploadWrapper
        endpoint={endpoint}
        successRedirect="/apps/skillshub/home"
      />
    </div>
  );
}
