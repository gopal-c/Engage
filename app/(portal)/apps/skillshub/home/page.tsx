import { redirect } from "next/navigation";
import Link from "next/link";
import { Hourglass, User, FileText, Lock } from "lucide-react";
import { requireSkillsHubRole } from "@/lib/skillshub/session";
import { getProfileByEmail, getMilestonesByProfileId } from "@/lib/skillshub/storage";
import { buildHomeData } from "@/lib/skillshub/timeline";
import { hasResumeData } from "@/lib/skillshub/domain";
import { TimelineColumn } from "@/components/skillshub/timeline-column";
import { TenureProgressBar } from "@/components/skillshub/progress-bar";

export default async function HomePage() {
  const session = await requireSkillsHubRole("employee");
  const profile = await getProfileByEmail(session.email);

  const approved = profile?.status === "approved";
  const hasData = profile ? hasResumeData(profile) : false;

  if (!profile) {
    return (
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-bold">
          Welcome, <span className="italic text-orange-500">{session.name}</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your journey with us — here&apos;s your story in milestones and moments.
        </p>
        <div className="mt-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 shadow-sm dark:bg-amber-950/30">
          <p className="text-sm font-medium text-foreground">Your profile hasn&apos;t been created yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please contact HR or wait for your onboarding.
          </p>
        </div>
      </section>
    );
  }

  if (!hasData && approved) {
    redirect("/apps/skillshub/upload");
  }

  const milestones = approved ? await getMilestonesByProfileId(profile.id) : [];
  const home = approved ? buildHomeData(profile, milestones) : null;

  return (
    <section className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-bold">
        Welcome, <span className="italic text-orange-500">{session.name}</span>
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your journey with us — here&apos;s your story in milestones and moments.
      </p>

      {/* Pending / not-approved state */}
      {!approved && (
        <>
          <div className="mt-6 flex items-start gap-3 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 shadow-sm dark:bg-amber-950/30">
            <Hourglass className="mt-0.5 size-5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Your account is pending approval
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {hasData
                  ? "HR has your profile on file and will approve your account shortly."
                  : "HR will review and approve your account shortly. You'll get access to your profile once approved."}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <HomeCard
              href="/apps/skillshub/me"
              enabled={false}
              icon={<User className="size-5" />}
              title="My Profile"
              description="View your skills, experience, and profile details."
            />
            <HomeCard
              href="/apps/skillshub/upload"
              enabled={false}
              icon={<FileText className="size-5" />}
              title="Update Profile"
              description="Upload a new resume to refresh your profile."
            />
          </div>
        </>
      )}

      {/* Approved: full timeline page */}
      {approved && home && (
        <>
          {/* Nav cards — shown when timeline is empty */}
          {home.leftColumn.length === 0 && home.rightColumn.length === 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <HomeCard
                href="/apps/skillshub/me"
                enabled
                icon={<User className="size-5" />}
                title="My Profile"
                description="View your skills, experience, and profile details."
              />
              <HomeCard
                href="/apps/skillshub/upload"
                enabled
                icon={<FileText className="size-5" />}
                title="Update Profile"
                description="Upload a new resume to refresh your profile."
              />
            </div>
          )}

          {/* Counter badges */}
          <div className="mt-8 flex flex-wrap gap-2">
            {home.tenureYears !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                <span className="text-sm font-bold text-foreground">{home.tenureYears}</span>
                {home.tenureYears === 1 ? "Year" : "Years"}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
              <span className="text-sm font-bold text-foreground">{home.promotions}</span>
              {home.promotions === 1 ? "Promotion" : "Promotions"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
              <span className="text-sm font-bold text-foreground">{home.certifications}</span>
              {home.certifications === 1 ? "Certification" : "Certifications"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
              <span className="text-sm font-bold text-foreground">{home.skillsCount}</span>
              {home.skillsCount === 1 ? "Skill" : "Skills"}
            </span>
          </div>

          {/* Progress bar */}
          {home.tenureYears !== null && (
            <TenureProgressBar percent={home.tenureProgressPercent} />
          )}

          {/* Stat cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-teal-100 text-lg dark:bg-teal-900/40">
                ⏱️
              </div>
              <div>
                <p className="text-lg font-bold">
                  {home.tenureYears !== null
                    ? `${home.tenureYears} ${home.tenureYears === 1 ? "Year" : "Years"}`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {home.tenureYears !== null
                    ? `${home.tenureYears} ${home.tenureYears === 1 ? "anniversary" : "anniversaries"} celebrated`
                    : "Joining date not set"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-orange-100 text-lg dark:bg-orange-900/40">
                ↗️
              </div>
              <div>
                <p className="text-lg font-bold">
                  {home.promotions} {home.promotions === 1 ? "Promotion" : "Promotions"}
                </p>
                <p className="text-xs text-muted-foreground">Career progression milestones</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-lg dark:bg-amber-900/40">
                🏅
              </div>
              <div>
                <p className="text-lg font-bold">
                  {home.certifications} {home.certifications === 1 ? "Certification" : "Certifications"}
                </p>
                <p className="text-xs text-muted-foreground">Professional credentials</p>
              </div>
            </div>
          </div>

          {/* Two-column timeline */}
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-lg font-semibold">Your Journey</h2>
              <TimelineColumn
                items={home.leftColumn}
                emptyText="Your journey starts here — milestones will appear as you grow with the team."
                variant="journey"
              />
            </div>
            <div>
              <h2 className="mb-4 text-lg font-semibold">Professional Growth</h2>
              <TimelineColumn
                items={home.rightColumn}
                emptyText={
                  home.rightEmptyReason === "no-education"
                    ? "Upload a resume to populate your professional growth timeline."
                    : "No certifications or courses recorded after your joining date. Upload an updated resume to add them."
                }
                variant="growth"
              />
            </div>
          </div>

          {/* Bottom nav links */}
          <div className="mt-8 flex gap-3">
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
        </>
      )}
    </section>
  );
}

function HomeCard({
  href,
  enabled,
  icon,
  title,
  description,
}: {
  href: string;
  enabled: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const body = (
    <>
      <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
    </>
  );

  if (!enabled) {
    return (
      <div
        className="relative flex items-start gap-3 rounded-xl border bg-card p-4 opacity-60 shadow-sm"
        title="Available once your account is approved"
      >
        <Lock className="absolute right-3 top-3 size-4 text-muted-foreground" />
        {body}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {body}
    </Link>
  );
}
