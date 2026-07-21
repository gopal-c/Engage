import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DeleteProfileButton } from "@/components/skillshub/delete-profile-button";
import { EditableAvatar } from "@/components/skillshub/editable-avatar";
import { avatarPalette, initials } from "@/lib/skillshub/avatar-gradient";
import { formatDate } from "@/lib/skillshub/domain";
import type { Profile, Skill } from "@/lib/skillshub/types";

const CATEGORY_ORDER = ["language", "framework", "database", "cloud", "tool", "domain", "soft"];
const CATEGORY_LABEL: Record<string, string> = {
  language:  "Languages",
  framework: "Frameworks",
  database:  "Databases",
  cloud:     "Cloud & ops",
  tool:      "Tools",
  domain:    "Domain knowledge",
  soft:      "Soft skills",
};

function groupByCategory(skills: Skill[]): Array<[string, Skill[]]> {
  const buckets = new Map<string, Skill[]>();
  for (const s of skills) {
    const k = (s.category || "other").toLowerCase();
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(s);
  }
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a); const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return sortedKeys.map((k) => [k, buckets.get(k)!]);
}

export function ProfileView({
  profile,
  canManage,
  editableAvatar = false,
}: {
  profile: Profile;
  canManage: boolean;
  editableAvatar?: boolean;
}) {
  const grouped = groupByCategory(profile.skills);
  const palette = avatarPalette(profile.name);
  const heroStyle = { "--halo": palette.halo } as React.CSSProperties;
  const isPending = profile.status === "pending";

  return (
    <div className="mx-auto max-w-3xl space-y-10 py-8">
      {/* HERO */}
      <section className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="relative shrink-0" style={heroStyle}>
          {editableAvatar ? (
            <EditableAvatar profile={profile} className="size-32 rounded-full object-cover ring-4 ring-[var(--halo)]" />
          ) : profile.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={profile.avatarUrl} alt={profile.name} className="size-32 rounded-full object-cover ring-4 ring-[var(--halo)]" />
          ) : (
            <div
              className="flex size-32 items-center justify-center rounded-full text-3xl font-bold text-white ring-4 ring-[var(--halo)]"
              style={{ background: `linear-gradient(135deg, ${palette.grad[0]}, ${palette.grad[1]})` }}
            >
              {initials(profile.name)}
            </div>
          )}
          <span
            className={`absolute bottom-1 right-1 size-4 rounded-full border-2 border-background ${
              isPending ? "bg-orange-400" : "bg-green-500"
            }`}
          />
        </div>

        <div className="flex-1 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{profile.seniority}</div>
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground sm:justify-start">
            <span>{profile.email}</span>
            <span className="hidden sm:inline">·</span>
            <span>{profile.city}</span>
            <span className="hidden sm:inline">·</span>
            <span>{profile.yearsExperience} yrs experience</span>
            {profile.joiningDate && (
              <>
                <span className="hidden sm:inline">·</span>
                <span>Joined {formatDate(profile.joiningDate)}</span>
              </>
            )}
            {profile.dateOfBirth && (
              <>
                <span className="hidden sm:inline">·</span>
                <span>DOB {formatDate(profile.dateOfBirth)}</span>
              </>
            )}
            {isPending && (
              <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                Pending review
              </span>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/apps/skillshub/review/${profile.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Edit
            </Link>
            <DeleteProfileButton id={profile.id} name={profile.name} />
          </div>
        )}
      </section>

      {/* SKILLS */}
      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</div>
        <div className="text-sm text-muted-foreground">{profile.skills.length} {profile.skills.length === 1 ? "skill" : "skills"}</div>

        {profile.skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills on record.</p>
        ) : (
          grouped.map(([cat, items]) => (
            <div key={cat} className="mt-6">
              <div className="mb-2 text-sm font-medium text-foreground">{CATEGORY_LABEL[cat] ?? cat}</div>
              <div className="flex flex-wrap gap-2">
                {items.map((s) => (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1 text-sm"
                  >
                    {s.name}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none ${
                        s.proficiency === "expert"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                          : s.proficiency === "advanced"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                            : s.proficiency === "intermediate"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.proficiency}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.yearsExperience} yr</span>
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* PROJECTS */}
      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Projects</div>
        <div className="text-sm text-muted-foreground">{profile.projects.length} {profile.projects.length === 1 ? "project" : "projects"}</div>

        {profile.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects on record.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {profile.projects.map((p, i) => (
              <article key={i} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold leading-snug">{p.name}</h3>
                  <span className="shrink-0 text-xs text-muted-foreground">{p.duration}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                {p.skillsUsed.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.skillsUsed.map((s) => (
                      <span key={s} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* EDUCATION */}
      <section className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Education</div>
        <div className="text-sm text-muted-foreground">{profile.education.length} {profile.education.length === 1 ? "entry" : "entries"}</div>

        {profile.education.length === 0 ? (
          <p className="text-sm text-muted-foreground">No education on record.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {profile.education.map((e, i) => (
              <article key={i} className="flex items-start justify-between rounded-lg border bg-card p-4 shadow-sm">
                <div>
                  <div className="font-semibold">{e.degree}</div>
                  <div className="text-sm text-muted-foreground">{e.institution}</div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {e.month ? `${new Date(2000, e.month - 1).toLocaleString("en-US", { month: "short" })} ${e.year}` : e.year}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
