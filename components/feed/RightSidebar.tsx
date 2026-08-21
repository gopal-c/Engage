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

export default function RightSidebar() {
  const [week, setWeek] = useState<ThisWeekData | null>(null);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [topIdeas, setTopIdeas] = useState<TopIdea[] | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/this-week").then((r) => r.json()).then(setWeek).catch(() => {});
    fetch("/api/dashboard/my-milestones").then((r) => r.json()).then((d) => setMilestones(d.milestones)).catch(() => {});
    fetch("/api/dashboard/top-ideas").then((r) => r.json()).then((d) => setTopIdeas(d.ideas)).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      {/* This Week */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-3">
          <CalendarDays className="size-3.5" /> This Week
        </h3>
        {!week ? (
          <div className="space-y-2">
            <div className="h-6 w-full rounded bg-muted animate-pulse" />
            <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {week.birthdays.length === 0 && week.anniversaries.length === 0 && (
              <p className="text-xs text-muted-foreground">Nothing this week!</p>
            )}
            {week.birthdays.map((b) => (
              <div key={b.user_id} className="flex items-center gap-2.5">
                <span className="text-base">🎂</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">{timeLabel(b.birthday_mmdd)}</p>
                </div>
              </div>
            ))}
            {week.anniversaries.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-base">🎉</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground">{a.years} year{a.years !== 1 ? "s" : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Milestones */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Trophy className="size-3.5" /> My Milestones
          </h3>
          <Link href="/apps/skillshub/milestones" className="text-[10px] text-muted-foreground hover:text-foreground transition">
            All <ChevronRight className="inline size-2.5" />
          </Link>
        </div>
        {!milestones ? (
          <div className="space-y-2">
            <div className="h-5 w-full rounded bg-muted animate-pulse" />
            <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
          </div>
        ) : milestones.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No milestones yet.{" "}
            <Link href="/apps/skillshub/milestones" className="text-indigo-deep hover:underline">Add one</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {milestones.slice(0, 4).map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <span className="text-sm">🏆</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{m.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(m.milestone_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Ideas This Month */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            🔥 Top Ideas
          </h3>
          <Link href="/apps/ideahub" className="text-[10px] text-muted-foreground hover:text-foreground transition">
            All <ChevronRight className="inline size-2.5" />
          </Link>
        </div>
        {!topIdeas ? (
          <div className="space-y-2">
            <div className="h-5 w-full rounded bg-muted animate-pulse" />
            <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
          </div>
        ) : topIdeas.length === 0 ? (
          <p className="text-xs text-muted-foreground">No ideas yet this month.</p>
        ) : (
          <div className="space-y-2">
            {topIdeas.map((idea, i) => (
              <Link key={idea.id} href={`/apps/ideahub/${idea.id}`} className="flex items-center gap-2 group">
                <span className="flex size-5 items-center justify-center rounded-md bg-secondary text-[10px] font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <p className="flex-1 text-xs font-medium truncate group-hover:text-indigo-deep transition">{idea.title}</p>
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
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
