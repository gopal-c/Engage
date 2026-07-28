"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ThumbsUp, Loader2, Sparkles, ChevronRight, Bookmark,
  Trophy, Lightbulb, PartyPopper, ArrowUpRight,
} from "lucide-react";

/* ────────── types ────────── */

type DashboardData = {
  user: { name: string; role: string; avatarUrl: string | null };
  profileCompletion: number;
  profileFields: { hasDob: boolean; hasBio: boolean; hasSkills: boolean; hasMilestone: boolean };
  anniversaryInfo: { years: number; daysUntil: number } | null;
  birthdays: {
    today: BirthdayPerson[];
    upcoming: BirthdayPerson[];
  };
  trending: TrendingIdea | null;
  activity: ActivityItem[];
  myIdeas: { count: number; totalVotes: number; recentStatusChanges: StatusChange[] };
  milestones: Milestone[];
  bookmarks: BookmarkIdea[];
  unvotedIdeas: UnvotedIdea[];
};

type BirthdayPerson = {
  name: string; email: string; avatar_url: string | null;
  department: string | null; bio: string | null; user_id: string; birthday_mmdd: string;
};

type TrendingIdea = {
  id: string; title: string; description: string;
  category_icon: string | null; category_name: string | null;
  net_votes: number; comment_count: number;
};

type ActivityItem = {
  id: string; source_app: string; event_type: string;
  title: string; description: string | null; created_at: string;
  user_name: string; user_avatar: string | null;
};

type StatusChange = { title: string; event_type: string; created_at: string };
type Milestone = { id: string; title: string; milestone_date: string; category: string };
type BookmarkIdea = { id: string; title: string; net_votes: number };
type UnvotedIdea = { id: string; title: string; description: string; category_icon: string | null; net_votes: number };

/* ────────── helpers ────────── */

const appIcons: Record<string, string> = { ideahub: "💡", skillshub: "🎯", birthdayhub: "🎂", engage: "⚡" };

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-red-50 text-red-700 border-red-200",
  hr: "bg-purple-50 text-purple-700 border-purple-200",
  manager: "bg-blue-50 text-blue-700 border-blue-200",
  employee: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

/* ────────── skeleton ────────── */

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

/* ────────── page ────────── */

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return;
      setData(await res.json());
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function quickUpvote(ideaId: string) {
    setVotingId(ideaId);
    try {
      const res = await fetch(`/api/ideahub/ideas/${ideaId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: "up" }),
      });
      const d = await res.json();
      if (d.ok) {
        toast.success("Upvoted!");
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            unvotedIdeas: prev.unvotedIdeas.filter((i) => i.id !== ideaId),
          };
        });
      }
    } catch { /* */ }
    setVotingId(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
          <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="py-24 text-center text-muted-foreground">Failed to load dashboard.</p>;
  }

  const firstName = data.user.name?.split(" ")[0] ?? "there";
  const hasTodayBirthdays = data.birthdays.today.length > 0;
  const birthdayList = hasTodayBirthdays ? data.birthdays.today : data.birthdays.upcoming;

  return (
    <div className="space-y-6">
      {/* ═══ GREETING BANNER ═══ */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {greeting()}, <span className="serif-italic">{firstName}</span>!
            </h1>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${ROLE_STYLES[data.user.role] ?? ROLE_STYLES.employee}`}>
                {data.user.role}
              </span>
              {data.anniversaryInfo && (
                <span className="text-sm text-muted-foreground">
                  Your {ordinal(data.anniversaryInfo.years)} anniversary is in {data.anniversaryInfo.daysUntil} days 🎉
                </span>
              )}
            </div>
          </div>

          {/* Profile completion ring */}
          <div className="flex items-center gap-3">
            <div className="relative size-12">
              <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" strokeWidth="3"
                  strokeDasharray={`${data.profileCompletion * 0.974} 100`}
                  strokeLinecap="round"
                  className="text-indigo-deep"
                  stroke="currentColor"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                {data.profileCompletion}%
              </span>
            </div>
            {data.profileCompletion < 100 ? (
              <Link href="/apps/skillshub" className="text-xs text-indigo-deep hover:underline">
                Complete your profile
              </Link>
            ) : (
              <span className="text-xs text-emerald-600 font-medium">Profile complete</span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ TWO-COLUMN GRID ═══ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ─── LEFT: What's Happening ─── */}
        <div className="space-y-4">
          {/* Birthday Spotlight */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                🎂 {hasTodayBirthdays ? "Birthdays Today" : "Upcoming Birthdays"}
              </h2>
              <Link href="/apps/birthdayhub" className="text-xs text-muted-foreground hover:text-foreground transition">
                View all <ChevronRight className="inline size-3" />
              </Link>
            </div>
            {birthdayList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No birthdays this week. Check back soon!</p>
            ) : (
              <div className="space-y-3">
                {birthdayList.map((b) => (
                  <div key={b.email} className="flex items-center gap-3">
                    {b.avatar_url ? (
                      <img src={b.avatar_url} alt="" className="size-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex size-10 items-center justify-center rounded-full bg-coral-soft text-sm font-bold text-coral-deep">
                        {b.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {b.department ?? ""}{b.bio ? (b.department ? " · " : "") + b.bio.slice(0, 50) : ""}
                      </p>
                    </div>
                    {hasTodayBirthdays && (
                      <Link
                        href="/apps/birthdayhub"
                        className="shrink-0 rounded-lg bg-coral-soft px-3 py-1.5 text-xs font-medium text-coral-deep hover:bg-coral/20 transition"
                      >
                        Send Wishes 🎂
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Idea */}
          {data.trending && (
            <Link href={`/apps/ideahub/${data.trending.id}`} className="block rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition">
              <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                🔥 Trending Idea
              </h2>
              <div className="flex items-start gap-2">
                {data.trending.category_icon && (
                  <span className="mt-0.5 text-lg">{data.trending.category_icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{data.trending.title}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><ThumbsUp className="size-3" /> {data.trending.net_votes}</span>
                    <span>{data.trending.comment_count} comments</span>
                  </div>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              </div>
            </Link>
          )}

          {/* Recent Activity */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                ⚡ Recent Activity
              </h2>
              <Link href="/activity" className="text-xs text-muted-foreground hover:text-foreground transition">
                View all <ChevronRight className="inline size-3" />
              </Link>
            </div>
            {(data.activity as ActivityItem[]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              <div className="space-y-2">
                {(data.activity as ActivityItem[]).map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5 py-1.5">
                    <span className="mt-0.5 text-base">{appIcons[a.source_app] ?? "⚡"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: My Stuff ─── */}
        <div className="space-y-4">
          {/* My Ideas Summary */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <Lightbulb className="size-4" /> My Ideas
            </h2>
            {data.myIdeas.count === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">Got an idea? Share it anonymously 💡</p>
                <Link
                  href="/apps/ideahub/submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-deep px-4 py-2 text-sm font-medium text-white hover:bg-indigo-press transition"
                >
                  <Sparkles className="size-3.5" /> Submit an Idea
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl bg-indigo-soft p-3 text-center">
                    <p className="text-2xl font-bold text-indigo-deep">{data.myIdeas.count}</p>
                    <p className="text-xs text-muted-foreground">ideas shared</p>
                  </div>
                  <div className="rounded-xl bg-amber-soft p-3 text-center">
                    <p className="text-2xl font-bold text-amber-deep">{data.myIdeas.totalVotes}</p>
                    <p className="text-xs text-muted-foreground">votes received</p>
                  </div>
                </div>
                {data.myIdeas.recentStatusChanges.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {data.myIdeas.recentStatusChanges.map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground truncate">
                        {s.title} · {timeAgo(s.created_at)}
                      </p>
                    ))}
                  </div>
                )}
                <Link href="/apps/ideahub/my-ideas" className="text-xs text-indigo-deep hover:underline">
                  View My Ideas <ChevronRight className="inline size-3" />
                </Link>
              </>
            )}
          </div>

          {/* My Milestones */}
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <Trophy className="size-4" /> My Milestones
              </h2>
              <Link href="/apps/skillshub/milestones" className="text-xs text-muted-foreground hover:text-foreground transition">
                View all <ChevronRight className="inline size-3" />
              </Link>
            </div>
            {(data.milestones as Milestone[]).length === 0 ? (
              <div className="text-center py-3">
                <p className="text-sm text-muted-foreground mb-2">Track your achievements</p>
                <Link
                  href="/apps/skillshub/milestones"
                  className="text-xs text-indigo-deep hover:underline"
                >
                  Add your first milestone
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {(data.milestones as Milestone[]).slice(0, 3).map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-amber-soft text-sm">🏆</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(m.milestone_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bookmarked Ideas */}
          {(data.bookmarks as BookmarkIdea[]).length > 0 && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  <Bookmark className="size-4" /> Bookmarked Ideas
                </h2>
              </div>
              <div className="space-y-2">
                {(data.bookmarks as BookmarkIdea[]).map((b) => (
                  <Link key={b.id} href={`/apps/ideahub/${b.id}`} className="flex items-center gap-2.5 py-1 hover:bg-secondary/50 rounded-lg px-1.5 -mx-1.5 transition">
                    <span className="text-base">💡</span>
                    <p className="flex-1 text-sm truncate">{b.title}</p>
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <ThumbsUp className="size-3" /> {b.net_votes}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM: Ideas Needing Your Vote ═══ */}
      {data.unvotedIdeas.length >= 2 && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <PartyPopper className="size-4" /> Ideas Needing Your Vote
            </h2>
            <Link href="/apps/ideahub" className="text-xs text-muted-foreground hover:text-foreground transition">
              Browse all <ChevronRight className="inline size-3" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {data.unvotedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="flex-none w-64 snap-start rounded-xl border bg-background p-4 space-y-2.5"
              >
                <div className="flex items-start gap-2">
                  {idea.category_icon && <span className="text-base mt-0.5">{idea.category_icon}</span>}
                  <Link href={`/apps/ideahub/${idea.id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1 hover:underline">{idea.title}</p>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{idea.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ThumbsUp className="size-3" /> {idea.net_votes}
                  </span>
                  <button
                    onClick={() => quickUpvote(idea.id)}
                    disabled={votingId === idea.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-soft px-3 py-1 text-xs font-medium text-indigo-deep hover:bg-indigo/20 transition disabled:opacity-50"
                  >
                    {votingId === idea.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <ThumbsUp className="size-3" />
                    )}
                    Upvote
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
