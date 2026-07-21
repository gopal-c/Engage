"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileCard } from "@/components/skillshub/profile-card";
import type { Profile } from "@/lib/skillshub/types";

function matches(p: Profile, q: string): boolean {
  if (!q) return true;
  const ql = q.toLowerCase();
  if (p.name.toLowerCase().includes(ql))      return true;
  if (p.city.toLowerCase().includes(ql))      return true;
  if (p.seniority.toLowerCase().includes(ql)) return true;
  if (p.status.toLowerCase().includes(ql))    return true;
  if (p.skills.some((s) => s.name.toLowerCase().includes(ql))) return true;
  return false;
}

export function DirectoryGrid({ profiles }: { profiles: Profile[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => profiles.filter((p) => matches(p, query.trim())), [profiles, query]);

  return (
    <div>
      <div className="toolbar">
        <div className="search">
          <Search className="icon size-4" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find anyone — name, skill, location, or status…"
          />
          {query && (
            <button
              type="button"
              className="clear-btn"
              onClick={() => setQuery("")}
              aria-label="Clear filter"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="count-strip">
        Showing {filtered.length} of {profiles.length} {profiles.length === 1 ? "employee" : "employees"}
      </p>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-s-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-eyebrow text-fg-3">No matches</p>
            <h3 className="mt-s-2">Nobody matches yet. Try fewer constraints?</h3>
            <p className="mt-s-2 text-[14px] text-fg-2">
              Filtered by: <span className="serif-italic">&ldquo;{query}&rdquo;</span>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid">
          {filtered.map((p, i) => (
            <ProfileCard
              key={p.id}
              profile={p}
              index={i}
              href={`/apps/skillshub/employees/${p.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
