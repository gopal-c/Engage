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
    <div className="profile-v2">
      {/* HERO */}
      <section className="hero">
        <div className="hero-avatar-wrap" style={heroStyle}>
          {editableAvatar ? (
            <EditableAvatar profile={profile} className="size-32 hero-avatar" />
          ) : profile.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={profile.avatarUrl} alt={profile.name} className="hero-avatar" />
          ) : (
            <div
              className="hero-avatar"
              style={{ background: `linear-gradient(135deg, ${palette.grad[0]}, ${palette.grad[1]})` }}
            >
              {initials(profile.name)}
            </div>
          )}
          <span className={`hero-status-dot ${isPending ? "pending" : ""}`} />
        </div>

        <div className="identity">
          <div className="ey">{profile.seniority}</div>
          <h1 className="name">{profile.name}</h1>
          <div className="meta">
            <span>{profile.email}</span>
            <span className="sep">·</span>
            <span>{profile.city}</span>
            <span className="sep">·</span>
            <span>{profile.yearsExperience} yrs experience</span>
            {profile.joiningDate && (
              <>
                <span className="sep">·</span>
                <span>Joined {formatDate(profile.joiningDate)}</span>
              </>
            )}
            {profile.dateOfBirth && (
              <>
                <span className="sep">·</span>
                <span>DOB {formatDate(profile.dateOfBirth)}</span>
              </>
            )}
            {isPending && <span className="pending-pill">Pending review</span>}
          </div>
        </div>

        {canManage && (
          <div className="actions">
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
      <section className="section">
        <div className="ey">Skills</div>
        <div className="count">{profile.skills.length} {profile.skills.length === 1 ? "skill" : "skills"}</div>

        {profile.skills.length === 0 ? (
          <p className="text-[14px] text-fg-2">No skills on record.</p>
        ) : (
          grouped.map(([cat, items]) => (
            <div key={cat} className="mt-6">
              <div className="cat">{CATEGORY_LABEL[cat] ?? cat}</div>
              <div className="skill-row">
                {items.map((s) => (
                  <span key={s.name} className="skill-pill">
                    {s.name}
                    <span className={`lvl ${s.proficiency}`}>{s.proficiency}</span>
                    <span className="yrs">{s.yearsExperience} yr</span>
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* PROJECTS */}
      <section className="section">
        <div className="ey">Projects</div>
        <div className="count">{profile.projects.length} {profile.projects.length === 1 ? "project" : "projects"}</div>

        {profile.projects.length === 0 ? (
          <p className="text-[14px] text-fg-2">No projects on record.</p>
        ) : (
          <div className="projects">
            {profile.projects.map((p, i) => (
              <article key={i} className="project-card">
                <div className="head">
                  <h3 className="title">{p.name}</h3>
                  <span className="when">{p.duration}</span>
                </div>
                <p className="desc">{p.description}</p>
                {p.skillsUsed.length > 0 && (
                  <div className="tags">
                    {p.skillsUsed.map((s) => (
                      <span key={s} className="tag">{s}</span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* EDUCATION */}
      <section className="section">
        <div className="ey">Education</div>
        <div className="count">{profile.education.length} {profile.education.length === 1 ? "entry" : "entries"}</div>

        {profile.education.length === 0 ? (
          <p className="text-[14px] text-fg-2">No education on record.</p>
        ) : (
          <div className="education">
            {profile.education.map((e, i) => (
              <article key={i} className="edu-card">
                <div className="edu-body">
                  <div className="school">{e.degree}</div>
                  <div className="place">{e.institution}</div>
                </div>
                <span className="year">{e.month ? `${new Date(2000, e.month - 1).toLocaleString("en-US", { month: "short" })} ${e.year}` : e.year}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
