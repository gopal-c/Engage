import { redirect } from "next/navigation";
import { getProfileByWorkEmailToken, verifyWorkEmail } from "@/lib/skillshub/storage";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto max-w-md py-20">
        <Card>
          <CardContent className="py-10 text-center">
            <h1 className="text-xl font-bold">Invalid Link</h1>
            <p className="mt-2 text-sm text-muted-foreground">No verification token provided.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = await getProfileByWorkEmailToken(token);
  if (!profile) {
    return (
      <div className="mx-auto max-w-md py-20">
        <Card>
          <CardContent className="py-10 text-center">
            <h1 className="text-xl font-bold">Link Expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This verification link has expired or already been used. Request a new one from your profile settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  await verifyWorkEmail(profile.id);

  return (
    <div className="mx-auto max-w-md py-20">
      <Card>
        <CardContent className="py-10 text-center">
          <h1 className="text-xl font-bold text-green-600">Email Verified</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your work email <strong>{profile.workEmail}</strong> has been verified.
          </p>
          <Link
            href="/apps/skillshub/home"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to SkillsHub
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
