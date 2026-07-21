"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    <Card>
      <CardHeader><CardTitle>Milestones &amp; Achievements ({milestones.length})</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {milestones.length === 0 && (
          <p className="text-[13px] text-muted-foreground">No milestones yet. Add one below.</p>
        )}
        {milestones.map((m) => (
          <div key={m.id} className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_130px_140px_auto]">
            <Input value={m.title} disabled />
            <Input value={m.category} disabled className="capitalize" />
            <Input type="date" value={m.milestoneDate} disabled />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(m.id)}
              disabled={deletingId === m.id}
              aria-label={`Remove ${m.title}`}
            >
              {deletingId === m.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </Button>
          </div>
        ))}
        {/* Add row — same inline layout as existing items */}
        <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_130px_140px_auto]">
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
          <Button
            type="button"
            size="sm"
            disabled={isAdding || !newTitle.trim() || !newDate}
            onClick={handleAdd}
          >
            {isAdding ? "…" : "+"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
