"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Milestone, MilestoneCategory } from "@/lib/skillshub/types";

const CATEGORY_OPTIONS: { value: MilestoneCategory; label: string }[] = [
  { value: "achievement", label: "Achievement" },
  { value: "promotion", label: "Promotion" },
  { value: "milestone", label: "Milestone" },
  { value: "celebration", label: "Celebration" },
  { value: "other", label: "Other" },
];

type Props = {
  profileId: string;
  initialMilestones: Milestone[];
};

export function MilestonesPanel({ profileId, initialMilestones }: Props) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<MilestoneCategory>("achievement");
  const [newDate, setNewDate] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAdding, startAdding] = useTransition();

  function handleAdd() {
    if (!newTitle.trim() || !newDate) return;
    startAdding(async () => {
      try {
        const res = await fetch("/api/skillshub/milestones", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ profileId, title: newTitle.trim(), milestoneDate: newDate, category: newCategory }),
        });
        const data = await res.json();
        if (!data.ok) { toast.error(data.error ?? "Couldn't add milestone."); return; }
        setMilestones((prev) =>
          [...prev, data.milestone as Milestone].sort((a, b) => (a.milestoneDate < b.milestoneDate ? 1 : -1)),
        );
        setNewTitle("");
        setNewCategory("achievement");
        setNewDate("");
      } catch { toast.error("Network error — try again."); }
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/skillshub/milestones/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.ok) { toast.error(data.error ?? "Couldn't delete milestone."); return; }
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    } catch { toast.error("Network error — try again."); }
    finally { setDeletingId(null); }
  }

  return (
    <section className="glass-surface rounded-2xl border border-white/70 p-6 shadow-2">
      <h3 className="mb-5 text-ink-800">Milestones &amp; Achievements ({milestones.length})</h3>
      <div className="space-y-2">
        {milestones.length === 0 && (
          <p className="mb-3 text-sm text-ink-400">No milestones yet. Add one below.</p>
        )}
        {milestones.map((m) => (
          <div key={m.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_130px_140px_auto]">
            <Input value={m.title} disabled />
            <Input value={m.category} disabled className="capitalize" />
            <Input type="date" value={m.milestoneDate} disabled />
            <button
              type="button"
              onClick={() => handleDelete(m.id)}
              disabled={deletingId === m.id}
              aria-label={`Remove ${m.title}`}
              className="flex size-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            >
              {deletingId === m.id ? <Loader2 className="size-3.5 animate-spin" /> : "×"}
            </button>
          </div>
        ))}
        {/* Add row */}
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_130px_140px_auto]">
          <Input
            placeholder="Achievement or milestone title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <select
            aria-label="Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as MilestoneCategory)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-[13px] text-foreground"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Input
            type="date"
            aria-label="Date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
          />
          <button
            type="button"
            disabled={isAdding || !newTitle.trim() || !newDate}
            onClick={handleAdd}
            className="flex size-8 items-center justify-center rounded-lg text-sm font-medium text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-800 disabled:opacity-50"
          >
            {isAdding ? "…" : "+"}
          </button>
        </div>
      </div>
    </section>
  );
}
