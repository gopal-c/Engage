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
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <p className="eyebrow-indigo mb-3">{hasResume ? "Update" : "Upload"}</p>
        <h1 className="display-xl">{hasResume ? "Update your resume." : "Upload your resume."}</h1>
        <p className="mt-3 text-lg text-ink-500">
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
