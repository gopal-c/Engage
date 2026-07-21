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
      <div className="mb-4">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find anyone — name, skill, location, or status…"
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button
              type="button"
              className="absolute right-3 flex items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
              onClick={() => setQuery("")}
              aria-label="Clear filter"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Showing {filtered.length} of {profiles.length} {profiles.length === 1 ? "employee" : "employees"}
      </p>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">No matches</p>
            <h3 className="mt-2">Nobody matches yet. Try fewer constraints?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Filtered by: <span className="italic">&ldquo;{query}&rdquo;</span>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
