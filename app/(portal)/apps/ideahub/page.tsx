"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, TrendingUp, Clock, ThumbsUp, ChevronDown } from "lucide-react";

type Category = { id: string; name: string; icon: string | null };
type Idea = {
  id: string;
  title: string;
  description: string;
  categoryName: string | null;
  categoryIcon: string | null;
  authorName: string | null;
  isAnonymous: boolean;
  status: string;
  impactScore: number | null;
  feasibilityScore: number | null;
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

const SORT_OPTIONS = [
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "newest", label: "Newest", icon: Clock },
  { value: "most_voted", label: "Most Voted", icon: ThumbsUp },
];

export default function IdeaHubPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("trending");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (sort) params.set("sort", sort);
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (search.trim()) params.set("search", search.trim());

    try {
      const res = await fetch(`/api/ideahub/ideas?${params}`);
      const data = await res.json();
      setIdeas(data.ideas ?? []);
      setTotal(data.total ?? 0);
    } catch { /* */ }
    setLoading(false);
  }, [page, sort, category, status, search]);

  useEffect(() => {
    fetch("/api/ideahub/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? [])).catch(() => {});
  }, []);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  useEffect(() => { setPage(1); }, [sort, category, status, search]);

  const totalPages = Math.ceil(total / limit);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">IdeaHub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share ideas, vote on what matters, shape the future
          </p>
        </div>
        <Link
          href="/apps/ideahub/submit"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-deep px-5 py-2.5 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3 hover:-translate-y-px"
        >
          <Plus className="size-4" />
          Submit Idea
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="w-full rounded-lg border bg-secondary pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-lg border bg-secondary pl-3 pr-8 py-2.5 text-sm focus:border-primary outline-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
          {/* Category filter */}
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none rounded-lg border bg-secondary pl-3 pr-8 py-2.5 text-sm focus:border-primary outline-none"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
          {/* Status filter */}
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none rounded-lg border bg-secondary pl-3 pr-8 py-2.5 text-sm focus:border-primary outline-none"
            >
              <option value="">All Status</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Sub-nav */}
      <nav className="flex items-center gap-1 rounded-full bg-secondary p-1 overflow-x-auto self-start w-fit">
        <Link
          href="/apps/ideahub"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card text-foreground shadow-sm"
        >
          <span>💡</span> Feed
        </Link>
        <Link
          href="/apps/ideahub/my-ideas"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
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

      {/* Ideas Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <span className="text-2xl animate-spin">💡</span>
          <p className="text-sm text-muted-foreground">Loading ideas...</p>
        </div>
      ) : ideas.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">💡</p>
          <p className="text-sm font-medium text-foreground">No ideas yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Be the first to share an idea!
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <Link
                key={idea.id}
                href={`/apps/ideahub/${idea.id}`}
                className="group rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${STATUS_COLORS[idea.status] ?? ""}`}>
                    {STATUS_LABELS[idea.status] ?? idea.status}
                  </span>
                  {idea.categoryIcon && (
                    <span className="text-lg" title={idea.categoryName ?? ""}>{idea.categoryIcon}</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-indigo-deep transition-colors">
                  {idea.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-3">
                  {idea.description}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" title="Votes">
                      <ThumbsUp className="size-3" /> {idea.netVotes}
                    </span>
                    <span className="flex items-center gap-1" title="Comments">
                      💬 {idea.commentCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{idea.isAnonymous ? "Anonymous" : idea.authorName}</span>
                    <span>·</span>
                    <span>{timeAgo(idea.createdAt)}</span>
                  </div>
                </div>
                {(idea.impactScore || idea.feasibilityScore) && (
                  <div className="mt-3 flex items-center gap-2">
                    {idea.impactScore && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Impact: {idea.impactScore}/10
                      </span>
                    )}
                    {idea.feasibilityScore && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        Feasibility: {idea.feasibilityScore}/10
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 hover:bg-secondary transition"
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 hover:bg-secondary transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
