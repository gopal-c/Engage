"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, ThumbsUp, Trophy, CalendarDays } from "lucide-react";

type ThisWeekData = {
  birthdays: { name: string; avatar_url: string | null; birthday_mmdd: string; user_id: string }[];
  anniversaries: { name: string; avatar_url: string | null; years: number }[];
};

type Milestone = { id: string; title: string; milestone_date: string; category: string };
type TopIdea = { id: string; title: string; net_votes: number; category_icon: string | null };

const AVATAR_COLORS = ["#8B7BE8", "#FF9A82", "#7CD3C5", "#FFCB6B", "#6B58D9", "#E87760", "#5BBFB0"];

function nameToColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeLabel(mmdd: string) {
  const now = new Date();
  const year = now.getFullYear();
  const [mm, dd] = mmdd.split("-").map(Number);
  const target = new Date(year, mm - 1, dd);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return target.toLocaleDateString("en-US", { weekday: "short" });
}

function SmallAvatar({ name, avatar }: { name: string; avatar: string | null }) {
  if (avatar) {
    return <img src={avatar} alt="" className="size-8 rounded-full object-cover" />;
  }
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const bg = nameToColor(name);
  return (
    <div
      className="flex size-8 items-center justify-center rounded-full text-[11px] font-bold text-white"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  );
}

export default function RightSidebar() {
  const [week, setWeek] = useState<ThisWeekData | null>(null);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [topIdeas, setTopIdeas] = useState<TopIdea[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/this-week").then((r) => r.json()).then((d) => { if (d.birthdays) setWeek(d); }).catch(() => {});
    fetch("/api/dashboard/my-milestones").then((r) => r.json()).then((d) => setMilestones(d.milestones ?? [])).catch(() => {});
    fetch("/api/dashboard/top-ideas").then((r) => r.json()).then((d) => setTopIdeas(d.ideas ?? [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-4 sticky top-20">
      {/* This Week */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5 mb-4">
          <CalendarDays className="size-3.5" /> This Week
        </h3>
        {!week ? (
          <div className="space-y-3">
            <div className="h-8 w-full rounded-lg bg-ink-100 animate-pulse" />
            <div className="h-8 w-3/4 rounded-lg bg-ink-100 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-3">
            {week.birthdays.length === 0 && week.anniversaries.length === 0 && (
              <p className="text-xs text-ink-400">Nothing this week!</p>
            )}
            {week.birthdays.map((b) => (
              <div key={b.user_id} className="flex items-center gap-3">
                <SmallAvatar name={b.name} avatar={b.avatar_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-700 truncate">{b.name}</p>
                  <p className="text-[10px] text-ink-400">🎂 {timeLabel(b.birthday_mmdd)}</p>
                </div>
                <Link
                  href="/apps/birthdayhub"
                  className="text-[10px] font-semibold text-amber-deep hover:text-coral-deep transition shrink-0"
                >
                  Wish
                </Link>
              </div>
            ))}
            {week.anniversaries.map((a, i) => (
              <div key={i} className="flex items-center gap-3">
                <SmallAvatar name={a.name} avatar={a.avatar_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink-700 truncate">{a.name}</p>
                  <p className="text-[10px] text-ink-400">🎉 {a.years}yr anniversary</p>
                </div>
                <span className="text-[10px] font-semibold text-teal-deep shrink-0">
                  Cheer
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Milestones */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
            <Trophy className="size-3.5" /> My Milestones
          </h3>
          <Link href="/apps/skillshub/milestones" className="text-[10px] font-semibold text-indigo-deep hover:text-indigo-press transition">
            All <ChevronRight className="inline size-2.5" />
          </Link>
        </div>
        {!milestones ? (
          <div className="space-y-2">
            <div className="h-5 w-full rounded bg-ink-100 animate-pulse" />
            <div className="h-5 w-3/4 rounded bg-ink-100 animate-pulse" />
          </div>
        ) : milestones.length === 0 ? (
          <p className="text-xs text-ink-400">
            No milestones yet.{" "}
            <Link href="/apps/skillshub/milestones" className="text-indigo-deep hover:underline font-semibold">Add one</Link>
          </p>
        ) : (
          <div className="space-y-2.5">
            {milestones.slice(0, 4).map((m) => (
              <div key={m.id} className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-soft text-sm">🏆</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink-700 truncate">{m.title}</p>
                  <p className="text-[10px] text-ink-400">
                    {new Date(m.milestone_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Ideas This Month */}
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
            🔥 Top Ideas
          </h3>
          <Link href="/apps/ideahub" className="text-[10px] font-semibold text-indigo-deep hover:text-indigo-press transition">
            All <ChevronRight className="inline size-2.5" />
          </Link>
        </div>
        {!topIdeas ? (
          <div className="space-y-2">
            <div className="h-5 w-full rounded bg-ink-100 animate-pulse" />
            <div className="h-5 w-3/4 rounded bg-ink-100 animate-pulse" />
          </div>
        ) : topIdeas.length === 0 ? (
          <p className="text-xs text-ink-400">No ideas yet this month.</p>
        ) : (
          <div className="space-y-2.5">
            {topIdeas.map((idea, i) => (
              <Link key={idea.id} href={`/apps/ideahub/${idea.id}`} className="flex items-center gap-2.5 group">
                <span className="flex size-5 items-center justify-center rounded-full bg-indigo-soft text-[10px] font-bold text-indigo-deep">
                  {i + 1}
                </span>
                <p className="flex-1 text-xs font-medium text-ink-700 truncate group-hover:text-indigo-deep transition">{idea.title}</p>
                <span className="text-[10px] text-ink-400 flex items-center gap-0.5">
                  <ThumbsUp className="size-2.5" /> {idea.net_votes}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
