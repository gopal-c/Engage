"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ActivityItem {
  id: string;
  source_app: string;
  event_type: string;
  title: string;
  description: string | null;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
}

const appIcons: Record<string, string> = {
  ideahub: "💡",
  skillshub: "🎯",
  birthdayhub: "🎂",
  engage: "⚡",
};

const filters = [
  { value: "", label: "All" },
  { value: "ideahub", label: "IdeaHub" },
  { value: "skillshub", label: "SkillsHub" },
  { value: "birthdayhub", label: "BirthdayHub" },
];

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filter) params.set("source", filter);

    fetch(`/api/activity?${params}`)
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [filter, page]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Activity Feed</h2>
        <p className="mt-1 text-muted-foreground">
          See what&apos;s happening across all apps
        </p>
      </div>

      <div className="flex gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => { setFilter(f.value); setPage(1); }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity found</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-lg border bg-card p-4"
            >
              <span className="mt-0.5 text-lg">
                {appIcons[item.source_app] ?? "⚡"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.user_name} &middot; {timeAgo(item.created_at)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs capitalize text-muted-foreground">
                {item.source_app}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={items.length < 20}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
