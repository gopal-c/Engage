import Link from "next/link";
import { getProfileByWorkEmailToken, verifyWorkEmail } from "@/lib/skillshub/storage";
import { hasResumeData } from "@/lib/skillshub/domain";
import { signPreApprovalUploadToken } from "@/lib/skillshub/upload-token";
import { ResendForm } from "@/components/skillshub/resend-form";
import { VerifyUploadPanel } from "@/components/skillshub/verify-upload-panel";
import { Card, CardContent } from "@/components/ui/card";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const profile = token ? await getProfileByWorkEmailToken(token) : undefined;

  if (profile) {
    await verifyWorkEmail(profile.id);
  }

  const uploadToken = profile ? await signPreApprovalUploadToken(profile.id) : null;

  return (
    <div className="mx-auto max-w-lg py-12 px-6">
      {profile ? (
        <>
          <Card>
            <CardContent className="py-8 text-center">
              <h1 className="text-xl font-bold text-green-600">Email Verified</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Thanks, {profile.name}. Your account is now waiting on HR approval — you&apos;ll
                be able to access your full profile once it&apos;s reviewed.
              </p>
              <Link
                href="/apps/skillshub/home"
                className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Go to SkillsHub
              </Link>
            </CardContent>
          </Card>

          {uploadToken && (
            <VerifyUploadPanel
              token={uploadToken}
              alreadyUploaded={hasResumeData(profile)}
            />
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <h1 className="text-xl font-bold">Link Expired or Invalid</h1>
            <p className="mt-2 mb-6 text-sm text-muted-foreground">
              That verification link isn&apos;t valid anymore. Enter your email below and
              we&apos;ll send a new one.
            </p>
            <ResendForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
