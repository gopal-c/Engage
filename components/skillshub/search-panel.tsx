"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { avatarPalette, initials } from "@/lib/skillshub/avatar-gradient";
import type { Profile } from "@/lib/skillshub/types";

type SearchResult = {
  profile: Profile;
  score: number;
  reason: string;
};

const EXAMPLES = [
  "Who knows React AND has worked on payment integrations?",
  "Senior backend engineers in Bangalore with Kafka experience",
  "Anyone with HIPAA / healthcare background?",
  "Mid-level full-stack with TypeScript and AWS",
];

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSearch(q?: string) {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    if (q) setQuery(q);
    startTransition(async () => {
      try {
        const res = await fetch("/api/skillshub/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: searchQuery.trim() }),
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
    <div className="space-y-8">
      {/* Glass search bar */}
      <div className="glass-surface flex items-center gap-3 rounded-full border border-white/70 px-5 py-3 shadow-2">
        <Search className="size-5 shrink-0 text-ink-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Ask in plain English — who knows X and has shipped Y?"
          className="min-w-0 flex-1 bg-transparent text-base text-ink-800 placeholder:text-ink-400 focus:outline-none"
        />
        <button
          onClick={() => handleSearch()}
          disabled={isPending || !query.trim()}
          className="shrink-0 rounded-full bg-indigo-deep px-5 py-2 text-sm font-medium text-white shadow-1 transition-all hover:bg-indigo-press hover:shadow-2 disabled:opacity-50"
        >
          {isPending ? "Searching..." : "Search →"}
        </button>
      </div>

      {/* Example queries */}
      {!searched && (
        <div className="flex flex-wrap items-start gap-2">
          <span className="eyebrow mt-1.5">Try</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => handleSearch(ex)}
              className="rounded-full border border-ink-200/80 bg-ink-0/60 px-3.5 py-1.5 text-sm text-ink-700 backdrop-blur-sm transition-all hover:border-indigo/40 hover:bg-indigo-soft hover:shadow-1"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!searched && (
        <div className="glass-surface mx-auto max-w-xl rounded-2xl border border-dashed border-ink-300/50 px-8 py-12 text-center shadow-1">
          <p className="eyebrow mb-2">Ready</p>
          <h3>
            Ask your <span className="serif-italic text-indigo">first question.</span>
          </h3>
          <p className="mt-2 text-sm text-ink-500">
            Each result comes with a one-line reason you can trust.
          </p>
        </div>
      )}

      {/* No results */}
      {searched && results.length === 0 && (
        <div className="glass-surface mx-auto max-w-xl rounded-2xl border border-white/70 px-8 py-12 text-center shadow-2">
          <p className="eyebrow mb-2">No matches</p>
          <h3>Nobody matches yet.</h3>
          <p className="mt-2 text-sm text-ink-500">Try fewer constraints or a different angle.</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-indigo-deep">
              <span className="text-lg">{results.length}</span>{" "}
              <span className="eyebrow">matches</span>
            </p>
            <span className="text-xs text-ink-400">ranked by relevance</span>
          </div>

          <div className="space-y-4">
            {results.map((r) => {
              const palette = avatarPalette(r.profile.name);
              return (
                <Link
                  key={r.profile.id}
                  href={`/apps/skillshub/employees/${r.profile.id}`}
                  className="glass-surface block rounded-2xl border border-white/70 p-5 shadow-2 transition-all hover:-translate-y-0.5 hover:shadow-3"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div
                      className="flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: `linear-gradient(135deg, ${palette.grad[0]}, ${palette.grad[1]})` }}
                    >
                      {initials(r.profile.name)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-ink-800">{r.profile.name}</p>
                      <p className="text-sm text-indigo-deep">
                        {r.profile.seniority}
                        <span className="text-ink-400"> · {r.profile.city} · {r.profile.yearsExperience} yrs</span>
                      </p>

                      {/* Why row */}
                      <div className="mt-2.5 rounded-lg bg-ink-800/[.04] px-3 py-2">
                        <span className="eyebrow-indigo mr-2 text-[10px]">Why</span>
                        <span className="text-sm text-ink-700">{r.reason}</span>
                      </div>

                      {/* Skills */}
                      {r.profile.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {r.profile.skills.slice(0, 6).map((s) => (
                            <span
                              key={s.name}
                              className="rounded-full border border-ink-200/80 bg-ink-0/60 px-2.5 py-0.5 font-mono text-[11px] text-ink-700"
                            >
                              {s.name}
                            </span>
                          ))}
                          {r.profile.skills.length > 6 && (
                            <span className="rounded-full bg-ink-200/60 px-2.5 py-0.5 font-mono text-[11px] text-ink-500">
                              +{r.profile.skills.length - 6}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Score */}
                    <div className="shrink-0 rounded-lg bg-ink-800 px-3 py-1.5 text-right">
                      <span className="text-lg font-bold text-teal">{r.score}</span>
                      <span className="text-xs text-ink-400"> / 100</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
