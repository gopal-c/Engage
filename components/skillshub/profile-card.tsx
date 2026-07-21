import Link from "next/link";
import { avatarPalette, initials } from "@/lib/skillshub/avatar-gradient";
import type { Profile } from "@/lib/skillshub/types";

function empId(i: number): string {
  return `SH-25${String(i + 1).padStart(3, "0")}`;
}

/**
 * Frosted ID-badge card used in both the directory and the review queue.
 *  - Approved profile  -> green status dot + sequential SH-25XXX employee id
 *  - Pending profile   -> coral status dot + "Approval Pending" badge
 */
export function ProfileCard({
  profile,
  index,
  href,
}: {
  profile: Profile;
  index: number;
  href: string;
}) {
  const palette = avatarPalette(profile.name);
  const visibleSkills = profile.skills.slice(0, 3);
  const more = profile.skills.length - visibleSkills.length;
  const isPending = profile.status === "pending";

  return (
    <Link
      href={href}
      className="id-card"
      style={{ "--halo": palette.halo } as React.CSSProperties}
    >
      <div className="id-avatar-wrap">
        {profile.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={profile.avatarUrl} alt={profile.name} className="id-avatar" />
        ) : (
          <div
            className="id-avatar"
            style={{ background: `linear-gradient(135deg, ${palette.grad[0]}, ${palette.grad[1]})` }}
          >
            {initials(profile.name)}
          </div>
        )}
        <span
          className={`id-status${isPending ? " pending" : ""}`}
          title={isPending ? "Pending review" : "Approved"}
        />
      </div>

      <div className="id-name">{profile.name}</div>
      <span className={`level-pill ${profile.seniority}`}>{profile.seniority}</span>
      <div className="id-loc">{profile.city}</div>

      <div className="id-skills">
        {visibleSkills.map((s) => (
          <span key={s.name} className="id-skill">{s.name}</span>
        ))}
        {more > 0 && <span className="id-skill more">+{more}</span>}
      </div>

      <div className="id-row">
        {isPending ? (
          <span className="pending-badge">Approval Pending</span>
        ) : (
          <span>{empId(index)}</span>
        )}
        <span className="yrs">{profile.yearsExperience} yrs</span>
      </div>
    </Link>
  );
}
