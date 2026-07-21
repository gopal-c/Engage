"use client";

import type { TimelineItem } from "@/lib/skillshub/timeline";

function formatMonthYear(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
}

const CATEGORY_COLOR: Record<string, string> = {
  achievement: "#FF9A82",
  promotion: "#FF9A82",
  milestone: "#7CD3C5",
  certification: "#8B7BE8",
  education: "#8B7BE8",
  celebration: "#FF9A82",
  other: "#8B7BE8",
};

export function TimelineColumn({
  items,
  emptyText,
  variant,
}: {
  items: TimelineItem[];
  emptyText: string;
  variant: "journey" | "growth";
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
    );
  }

  return (
    <div className="relative space-y-4 pl-6">
      {/* Vertical track line */}
      <div className="absolute bottom-0 left-[9px] top-0 w-px bg-border" />

      {items.map((item) => {
        const color = CATEGORY_COLOR[item.category] ?? "#8B7BE8";
        const isJourney = variant === "journey";

        return (
          <div key={item.id} className="relative">
            {/* Dot */}
            <div
              className="absolute -left-6 top-3 size-[10px] rounded-full ring-2 ring-background"
              style={{ background: color }}
            />

            {/* Card */}
            <div
              className={`rounded-lg border p-3 ${
                isJourney
                  ? "bg-card shadow-sm"
                  : "bg-muted/50"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className="flex size-7 flex-shrink-0 items-center justify-center rounded-md text-sm"
                  style={{ background: `${color}20`, color }}
                >
                  {item.icon}
                </span>
                <h3 className="text-sm font-medium leading-tight">{item.title}</h3>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                  {item.category}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {formatMonthYear(item.milestoneDate)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
