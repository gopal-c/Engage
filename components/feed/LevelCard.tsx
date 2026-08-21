"use client";

import { useEffect, useState } from "react";
import { Trophy, Star } from "lucide-react";

type LevelData = {
  totalXP: number;
  level: number;
  title: string;
  nextLevelXP: number;
  currentLevelXP: number;
  badges: { badge_key: string; earned_at: string }[];
  allBadges: { key: string; name: string; description: string; icon: string }[];
};

export default function LevelCard() {
  const [data, setData] = useState<LevelData | null>(null);

  useEffect(() => {
    fetch("/api/xp")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="rounded-2xl border bg-card p-5 shadow-sm animate-pulse space-y-3">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-8 w-full rounded bg-muted" />
      </div>
    );
  }

  const progress = data.nextLevelXP > data.currentLevelXP
    ? ((data.totalXP - data.currentLevelXP) / (data.nextLevelXP - data.currentLevelXP)) * 100
    : 100;

  const earnedKeys = new Set(data.badges.map((b) => b.badge_key));

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      {/* Level info */}
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-soft">
          <Star className="size-5 text-indigo-deep" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Level {data.level}
          </p>
          <p className="text-sm font-bold text-foreground">{data.title}</p>
        </div>
        <span className="text-lg font-bold text-indigo-deep">{data.totalXP} XP</span>
      </div>

      {/* XP progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>{data.totalXP - data.currentLevelXP} / {data.nextLevelXP - data.currentLevelXP} XP</span>
          <span>Level {data.level + 1}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-deep to-indigo transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Badges */}
      {data.allBadges.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
            <Trophy className="size-3" /> Badges
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.allBadges.map((b) => {
              const earned = earnedKeys.has(b.key);
              return (
                <span
                  key={b.key}
                  title={`${b.name}: ${b.description}`}
                  className={`text-base cursor-default transition ${earned ? "" : "opacity-25 grayscale"}`}
                >
                  {b.icon}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
