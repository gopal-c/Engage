import Link from "next/link";
import { avatarPalette, initials } from "@/lib/skillshub/avatar-gradient";
import type { Profile } from "@/lib/skillshub/types";

function empId(i: number): string {
  return `SH-25${String(i + 1).padStart(3, "0")}`;
}

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
      className="group flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Avatar + status */}
      <div className="relative inline-flex self-start">
        {profile.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="size-12 rounded-full object-cover ring-2 ring-background"
          />
        ) : (
          <div
            className="flex size-12 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-background"
            style={{ background: `linear-gradient(135deg, ${palette.grad[0]}, ${palette.grad[1]})` }}
          >
            {initials(profile.name)}
          </div>
        )}
        <span
          className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background ${
            isPending ? "bg-orange-400" : "bg-green-500"
          }`}
          title={isPending ? "Pending review" : "Approved"}
        />
      </div>

      {/* Name + meta */}
      <div>
        <p className="font-medium leading-tight">{profile.name}</p>
        <span className="mt-0.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
          {profile.seniority}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{profile.city}</p>

      {/* Skills */}
      <div className="flex flex-wrap gap-1">
        {visibleSkills.map((s) => (
          <span key={s.name} className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
            {s.name}
          </span>
        ))}
        {more > 0 && (
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">
            +{more}
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
        {isPending ? (
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
            Approval Pending
          </span>
        ) : (
          <span className="font-mono">{empId(index)}</span>
        )}
        <span>{profile.yearsExperience} yrs</span>
      </div>
    </Link>
  );
}
