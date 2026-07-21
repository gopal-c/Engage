"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { avatarPalette, initials } from "@/lib/skillshub/avatar-gradient";
import type { Profile } from "@/lib/skillshub/types";

type SearchResult = {
  profile: Profile;
  score: number;
  reason: string;
};

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSearch() {
    if (!query.trim()) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/skillshub/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: query.trim() }),
        });
        const data = await res.json();
        if (data.ok) {
          setResults(data.results ?? []);
        } else {
          setResults([]);
        }
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. 'senior React developer with AWS experience'..."
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={isPending || !query.trim()}>
          {isPending ? "Searching..." : "Search"}
        </Button>
      </div>

      {searched && results.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">No matching profiles found.</p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => {
            const palette = avatarPalette(r.profile.name);
            return (
              <Card key={r.profile.id}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${palette.grad[0]}, ${palette.grad[1]})` }}
                  >
                    {initials(r.profile.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/apps/skillshub/employees/${r.profile.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.profile.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {r.profile.seniority} &middot; {r.profile.city} &middot; {r.profile.yearsExperience} yrs
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground italic">{r.reason}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-2xl font-bold">{r.score}</div>
                    <div className="text-xs text-muted-foreground">match</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
