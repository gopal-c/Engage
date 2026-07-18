"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ActivityItem, timeAgo, type ActivityItemData } from "@/components/activity-item";

const filters = [
  { value: "", label: "All" },
  { value: "ideahub", label: "IdeaHub" },
  { value: "skillshub", label: "SkillsHub" },
  { value: "birthdayhub", label: "BirthdayHub" },
];

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItemData[]>([]);
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

      <div className="flex flex-wrap gap-2">
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
        <div className="space-y-2">
          {items.map((item) => (
            <ActivityItem key={item.id} item={item} />
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
