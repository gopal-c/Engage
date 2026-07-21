import { redirect } from "next/navigation";
import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getProfileByEmail, getMilestonesByProfileId } from "@/lib/skillshub/storage";
import { buildHomeData } from "@/lib/skillshub/timeline";
import { hasResumeData } from "@/lib/skillshub/domain";
import { TimelineColumn } from "@/components/skillshub/timeline-column";
import { TenureProgressBar } from "@/components/skillshub/progress-bar";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function HomePage() {
  const session = await requireSkillsHubRole("employee");
  const profile = await getProfileByEmail(session.email);

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <h1 className="text-2xl font-bold">Welcome to SkillsHub</h1>
        <p className="mt-2 text-muted-foreground">
          Your profile hasn&apos;t been created yet. Please contact HR or wait for your onboarding.
        </p>
      </div>
    );
  }

  if (!hasResumeData(profile)) {
    redirect("/apps/skillshub/upload");
  }

  if (profile.status !== "approved") {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <h1 className="text-2xl font-bold">Profile Under Review</h1>
        <p className="mt-2 text-muted-foreground">
          Your profile is currently <span className="font-medium capitalize">{profile.status}</span>.
          HR will review it shortly.
        </p>
      </div>
    );
  }

  const milestones = await getMilestonesByProfileId(profile.id);
  const home = buildHomeData(profile, milestones);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {profile.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">{profile.seniority} &middot; {profile.city}</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{home.tenureYears ?? "—"}</div>
            <p className="text-sm text-muted-foreground">Years at company</p>
            {home.tenureYears !== null && (
              <div className="mt-2">
                <TenureProgressBar percent={home.tenureProgressPercent} />
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{home.skillsCount}</div>
            <p className="text-sm text-muted-foreground">Skills</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{home.promotions}</div>
            <p className="text-sm text-muted-foreground">Promotions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{home.certifications}</div>
            <p className="text-sm text-muted-foreground">Certifications</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-semibold">Milestones & Events</h2>
          <TimelineColumn items={home.leftColumn} emptyText="No milestones yet." variant="journey" />
        </div>
        <div>
          <h2 className="mb-4 text-lg font-semibold">Education & Certifications</h2>
          <TimelineColumn
            items={home.rightColumn}
            emptyText={home.rightEmptyReason === "no-education" ? "No education records." : "Add a joining date to see education timeline."}
            variant="growth"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Link
          href="/apps/skillshub/me"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          View my profile
        </Link>
        <Link
          href="/apps/skillshub/upload"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Update resume
        </Link>
      </div>
    </div>
  );
}
