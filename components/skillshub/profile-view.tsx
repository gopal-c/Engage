import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { DeleteProfileButton } from "@/components/skillshub/delete-profile-button";
import { ApproveRejectButtons } from "@/components/skillshub/profile-actions";
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

const PROFICIENCY_STYLE: Record<string, string> = {
  expert:       "bg-teal/30 text-teal-deep border-teal/25",
  advanced:     "bg-indigo-soft text-indigo-deep border-indigo/20",
  intermediate: "bg-amber-soft text-amber-deep border-amber/25",
  beginner:     "bg-coral-soft text-coral-deep border-coral/20",
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
    <div className="mx-auto max-w-3xl space-y-12 py-8">
      {/* Back link */}
      {canManage && (
        <Link href="/apps/skillshub/employees" className="text-sm text-ink-500 hover:text-ink-700">
          ← Back to directory
        </Link>
      )}

      {/* HERO */}
      <section className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="relative shrink-0" style={heroStyle}>
          {editableAvatar ? (
            <EditableAvatar profile={profile} className="size-28 rounded-full object-cover ring-4 ring-[var(--halo)]" />
          ) : profile.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={profile.avatarUrl} alt={profile.name} className="size-28 rounded-full object-cover ring-4 ring-[var(--halo)]" />
          ) : (
            <div
              className="flex size-28 items-center justify-center rounded-full text-3xl font-bold text-white ring-4 ring-[var(--halo)]"
              style={{ background: `linear-gradient(135deg, ${palette.grad[0]}, ${palette.grad[1]})` }}
            >
              {initials(profile.name)}
            </div>
          )}
          <span
            className={`absolute bottom-1 right-1 size-4 rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.85)] ${
              isPending ? "bg-coral-deep" : "bg-teal"
            }`}
          />
        </div>

        <div className="flex-1 space-y-1">
          <p className="eyebrow-indigo">{profile.seniority}</p>
          <h1 className="display-xl">{profile.name}</h1>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-ink-500 sm:justify-start">
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
          </div>
          {isPending && (
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-coral/25 bg-coral-soft px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-coral-deep">
              <span className="size-1.5 rounded-full bg-coral-deep" />
              Pending review
            </span>
          )}
        </div>

        {canManage && (
          <div className="flex shrink-0 items-center gap-2">
            {isPending && (
              <ApproveRejectButtons profileId={profile.id} profileName={profile.name} />
            )}
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
      <section className="space-y-4">
        <div>
          <p className="eyebrow mb-1">Skills</p>
          <h2 className="display-xl text-3xl">
            {profile.skills.length} {profile.skills.length === 1 ? "skill" : "skills"}
          </h2>
        </div>

        {profile.skills.length === 0 ? (
          <p className="text-sm text-ink-500">No skills on record.</p>
        ) : (
          grouped.map(([cat, items]) => (
            <div key={cat} className="mt-4">
              <p className="eyebrow mb-3">{CATEGORY_LABEL[cat] ?? cat}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((s) => (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-2 rounded-full border border-ink-200/60 bg-ink-0/60 px-3 py-1.5 text-sm backdrop-blur-sm"
                  >
                    <span className="text-ink-800">{s.name}</span>
                    <span
                      className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none ${
                        PROFICIENCY_STYLE[s.proficiency] ?? PROFICIENCY_STYLE.beginner
                      }`}
                    >
                      {s.proficiency}
                    </span>
                    <span className="text-xs text-ink-400">{s.yearsExperience} yr</span>
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* PROJECTS */}
      <section className="space-y-4">
        <div>
          <p className="eyebrow mb-1">Projects</p>
          <h2 className="display-xl text-3xl">
            {profile.projects.length} {profile.projects.length === 1 ? "project" : "projects"}
          </h2>
        </div>

        {profile.projects.length === 0 ? (
          <p className="text-sm text-ink-500">No projects on record.</p>
        ) : (
          <div className="space-y-4">
            {profile.projects.map((p, i) => (
              <article key={i} className="glass-surface rounded-2xl border border-white/70 p-5 shadow-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-ink-800">{p.name}</h3>
                  <span className="shrink-0 text-xs text-ink-400">{p.duration}</span>
                </div>
                <p className="mt-1.5 text-sm text-ink-500">{p.description}</p>
                {p.skillsUsed.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.skillsUsed.map((s) => (
                      <span key={s} className="rounded-full border border-ink-200/80 bg-ink-0/60 px-2.5 py-0.5 font-mono text-[11px] text-ink-700">
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
      <section className="space-y-4">
        <div>
          <p className="eyebrow mb-1">Education</p>
          <h2 className="display-xl text-3xl">
            {profile.education.length} {profile.education.length === 1 ? "entry" : "entries"}
          </h2>
        </div>

        {profile.education.length === 0 ? (
          <p className="text-sm text-ink-500">No education on record.</p>
        ) : (
          <div className="space-y-4">
            {profile.education.map((e, i) => (
              <article key={i} className="glass-surface flex items-start justify-between rounded-2xl border border-white/70 p-5 shadow-2">
                <div>
                  <h3 className="font-semibold text-ink-800">{e.degree}</h3>
                  <p className="mt-1 text-sm text-ink-500">{e.institution}</p>
                </div>
                <span className="shrink-0 rounded-full border border-ink-200/60 bg-ink-0/60 px-2.5 py-1 text-xs font-medium text-ink-600">
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
