import Link from "next/link";
import { avatarPalette, initials } from "@/lib/skillshub/avatar-gradient";
import type { Profile } from "@/lib/skillshub/types";

function empId(i: number): string {
  return `SH-25${String(i + 1).padStart(3, "0")}`;
}

const SENIORITY_STYLE: Record<string, string> = {
  lead:   "bg-coral/[.38] border-coral/[.35]",
  senior: "bg-teal/[.40] border-teal/[.35]",
  mid:    "bg-amber/[.42] border-amber/[.40]",
  junior: "bg-indigo/[.34] border-indigo/[.25]",
};

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
      className="id-card group"
      style={{ "--halo": palette.halo } as React.CSSProperties}
    >
      {/* Avatar + halo + status dot */}
      <div className="relative mx-auto mb-4 mt-5">
        <div className="id-avatar-glow" />
        {profile.avatarUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={profile.avatarUrl}
            alt={profile.name}
            className="relative size-24 rounded-full object-cover shadow-[0_10px_24px_rgba(21,22,52,0.22),0_0_0_4px_rgba(255,255,255,0.65),0_0_0_5px_rgba(21,22,52,0.06)]"
          />
        ) : (
          <div
            className="relative flex size-24 items-center justify-center rounded-full text-[32px] font-light tracking-tight text-white shadow-[0_10px_24px_rgba(21,22,52,0.22),0_0_0_4px_rgba(255,255,255,0.65),0_0_0_5px_rgba(21,22,52,0.06)]"
            style={{ background: `linear-gradient(135deg, ${palette.grad[0]}, ${palette.grad[1]})` }}
          >
            {initials(profile.name)}
          </div>
        )}
        <span
          className={`absolute bottom-1 right-1 size-[18px] rounded-full shadow-[0_0_0_3px_rgba(255,255,255,0.85)] ${
            isPending ? "bg-coral-deep" : "bg-teal"
          }`}
          title={isPending ? "Pending review" : "Approved"}
        />
      </div>

      {/* Name */}
      <p className="text-[19px] font-semibold leading-tight tracking-tight text-ink-800">
        {profile.name}
      </p>

      {/* Seniority pill */}
      <span
        className={`mt-2 inline-flex items-center rounded-full border px-[11px] py-[3px] font-mono text-[11px] uppercase leading-tight tracking-widest text-black/60 ${
          SENIORITY_STYLE[profile.seniority] ?? SENIORITY_STYLE.junior
        }`}
      >
        {profile.seniority}
      </span>

      {/* City */}
      <p className="mt-2.5 text-[13px] text-ink-600">{profile.city}</p>

      {/* Skills */}
      <div className="mt-3 flex flex-wrap justify-center gap-[5px]">
        {visibleSkills.map((s) => (
          <span
            key={s.name}
            className="rounded-[7px] border border-ink-200/85 bg-white/55 px-[9px] py-1 font-mono text-[11px] leading-tight text-ink-800 backdrop-blur-sm"
          >
            {s.name}
          </span>
        ))}
        {more > 0 && (
          <span className="rounded-[7px] border border-transparent bg-ink-800/85 px-[9px] py-1 font-mono text-[11px] leading-tight text-white">
            +{more}
          </span>
        )}
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex w-full items-center justify-between border-t border-dashed border-ink-800/[.12] pt-3.5 font-mono text-[11px] uppercase tracking-widest text-ink-600">
        {isPending ? (
          <span className="rounded-full bg-coral-soft px-2 py-0.5 text-[11px] font-medium normal-case tracking-normal text-coral-deep">
            Approval Pending
          </span>
        ) : (
          <span>{empId(index)}</span>
        )}
        <span>{profile.yearsExperience} yrs</span>
      </div>
    </Link>
  );
}
