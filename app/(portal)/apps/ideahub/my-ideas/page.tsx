"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ThumbsUp, Plus } from "lucide-react";

type Idea = {
  id: string;
  title: string;
  description: string;
  categoryName: string | null;
  categoryIcon: string | null;
  isAnonymous: boolean;
  status: string;
  netVotes: number;
  commentCount: number;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  implemented: "bg-purple-50 text-purple-700 border-purple-200",
  declined: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  approved: "Approved",
  implemented: "Implemented",
  declined: "Declined",
};

export default function MyIdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ideahub/ideas?mine=true")
      .then((r) => r.json())
      .then((d) => setIdeas(d.ideas ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/apps/ideahub"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Ideas</h1>
            <p className="text-sm text-muted-foreground">
              Your submitted ideas — including anonymous ones
            </p>
          </div>
        </div>
        <Link
          href="/apps/ideahub/submit"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-deep px-5 py-2.5 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3"
        >
          <Plus className="size-4" /> New Idea
        </Link>
      </div>

      {/* Sub-nav */}
      <nav className="flex items-center gap-1 rounded-full bg-secondary p-1 overflow-x-auto self-start w-fit">
        <Link
          href="/apps/ideahub"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
        >
          <span>💡</span> Feed
        </Link>
        <Link
          href="/apps/ideahub/my-ideas"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card text-foreground shadow-sm"
        >
          <span>📝</span> My Ideas
        </Link>
        <Link
          href="/apps/ideahub/leaderboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
        >
          <span>🏆</span> Leaderboard
        </Link>
      </nav>

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <span className="text-2xl animate-spin">💡</span>
          <p className="text-sm text-muted-foreground">Loading your ideas...</p>
        </div>
      ) : ideas.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm font-medium text-foreground">No ideas yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Submit your first idea!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => (
            <Link
              key={idea.id}
              href={`/apps/ideahub/${idea.id}`}
              className="flex items-center justify-between gap-4 rounded-xl border bg-card px-5 py-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[idea.status]}`}>
                    {STATUS_LABELS[idea.status]}
                  </span>
                  {idea.isAnonymous && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      🎭 Anonymous
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground truncate">
                  {idea.title}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {idea.description}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ThumbsUp className="size-3" /> {idea.netVotes}
                </span>
                <span>💬 {idea.commentCount}</span>
                <span>{timeAgo(idea.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
