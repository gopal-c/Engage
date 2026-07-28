"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";

type LeaderboardEntry = {
  userId: string;
  userName: string;
  userAvatar: string | null;
  ideaCount: number;
  votesReceived: number;
  commentCount: number;
  totalScore: number;
  rank: number;
};

const RANK_TITLES: [number, string, string][] = [
  [1, "Visionary", "🏆"],
  [2, "Thought Leader", "🥈"],
  [3, "Innovator", "🥉"],
  [5, "Trailblazer", "⚡"],
  [10, "Contributor", "🌟"],
  [Infinity, "Participant", "💡"],
];

function getRankTitle(rank: number): { title: string; icon: string } {
  for (const [threshold, title, icon] of RANK_TITLES) {
    if (rank <= threshold) return { title, icon };
  }
  return { title: "Participant", icon: "💡" };
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ideahub/leaderboard")
      .then((r) => r.json())
      .then((d) => setEntries(d.leaderboard ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/apps/ideahub"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">
            Top contributors ranked by ideas, votes, and engagement
          </p>
        </div>
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
        >
          <span>📝</span> My Ideas
        </Link>
        <Link
          href="/apps/ideahub/leaderboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card text-foreground shadow-sm"
        >
          <span>🏆</span> Leaderboard
        </Link>
      </nav>

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <Trophy className="size-5 animate-pulse text-amber-500" />
          <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-sm font-medium text-foreground">No contributors yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Submit non-anonymous ideas to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top 3 cards */}
          {entries.length >= 3 && (
            <div className="grid gap-4 sm:grid-cols-3 mb-4">
              {entries.slice(0, 3).map((entry) => {
                const { title, icon } = getRankTitle(entry.rank);
                return (
                  <div
                    key={entry.userId}
                    className={`rounded-2xl border p-5 text-center shadow-sm ${
                      entry.rank === 1
                        ? "border-amber-200 bg-amber-50/50"
                        : entry.rank === 2
                        ? "border-slate-200 bg-slate-50/50"
                        : "border-orange-200 bg-orange-50/50"
                    }`}
                  >
                    <p className="text-3xl mb-2">{icon}</p>
                    {entry.userAvatar ? (
                      <img
                        src={entry.userAvatar}
                        alt={entry.userName}
                        className="mx-auto size-14 rounded-full object-cover mb-2"
                      />
                    ) : (
                      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-indigo-50 text-lg font-bold text-indigo-700 mb-2">
                        {entry.userName[0]}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-foreground">{entry.userName}</p>
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <p className="mt-2 text-lg font-bold text-foreground">{entry.totalScore}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">points</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Contributor</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Ideas</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Votes</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Comments</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Score</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const { title, icon } = getRankTitle(entry.rank);
                  return (
                    <tr key={entry.userId} className="border-b last:border-0 hover:bg-muted/30 transition">
                      <td className="px-4 py-3 text-foreground font-medium">
                        <span className="mr-1">{icon}</span> #{entry.rank}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.userAvatar ? (
                            <img src={entry.userAvatar} alt="" className="size-7 rounded-full object-cover" />
                          ) : (
                            <div className="flex size-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
                              {entry.userName[0]}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">{entry.userName}</p>
                            <p className="text-[10px] text-muted-foreground">{title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{entry.ideaCount}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{entry.votesReceived}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{entry.commentCount}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{entry.totalScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
