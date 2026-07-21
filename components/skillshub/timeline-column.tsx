"use client";

import type { TimelineItem } from "@/lib/skillshub/timeline";

function formatMonthYear(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
}

const CATEGORY_COLOR: Record<string, string> = {
  achievement: "var(--brand-coral)",
  promotion: "var(--brand-coral)",
  milestone: "var(--brand-teal)",
  certification: "var(--brand-indigo)",
  education: "var(--brand-indigo)",
  celebration: "var(--brand-coral)",
  other: "var(--brand-indigo)",
};

// "Your Journey" column uses project-card style; "Professional Growth" uses edu-card style
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
      <div className="timeline-empty">
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="timeline-track">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="timeline-item"
          style={{ animationDelay: `${Math.min(i, 5) * 0.1}s` }}
        >
          <div className="timeline-dot" style={{ background: CATEGORY_COLOR[item.category] ?? "var(--brand-indigo)" }} />
          {/* Visual style sourced from ProjectCard (journey) / EducationCard (growth) */}
          <article className={variant === "journey" ? "tl-project-card" : "tl-edu-card"}>
            <div className="tl-card-head">
              <span className="tl-card-icon" style={{ background: CATEGORY_COLOR[item.category] ?? "var(--brand-indigo)" }}>
                {item.icon}
              </span>
              <h3 className="tl-card-title">{item.title}</h3>
            </div>
            <div className="tl-card-meta">
              <span className="tl-card-badge">{item.category}</span>
              <span className="tl-card-date">{formatMonthYear(item.milestoneDate)}</span>
            </div>
          </article>
        </div>
      ))}
    </div>
  );
}
