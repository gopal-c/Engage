"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FolderKanban, Users, Calendar } from "lucide-react";

type MyProject = {
  id: string; name: string; description: string | null; status: string;
  department: string | null; requiredSkills: string[]; memberCount: number;
  startDate: string | null; myRole: string;
};

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-slate-50 text-slate-700 border-slate-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-zinc-50 text-zinc-500 border-zinc-200",
};
const STATUS_LABELS: Record<string, string> = {
  planning: "Planning", active: "Active", on_hold: "On Hold", completed: "Completed", archived: "Archived",
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projectshub/my-projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/apps/projectshub" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-4 transition">
        <ArrowLeft className="size-4" /> All Projects
      </Link>

      <h1 className="text-2xl font-bold text-ink-800 mb-1">My Projects</h1>
      <p className="text-sm text-ink-500 mb-6">Projects you&apos;re a member of</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-5 space-y-3" style={{ borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white p-10 text-center" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <FolderKanban className="size-10 text-ink-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-ink-800 mb-1">You haven&apos;t joined any projects</p>
          <p className="text-sm text-ink-500 mb-4">Browse all projects to find one</p>
          <Link
            href="/apps/projectshub"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-deep px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-press transition shadow-sm"
          >
            Browse Projects
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/apps/projectshub/${p.id}`}
              className="bg-white p-5 hover:shadow-md transition group"
              style={{ borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-ink-800 group-hover:text-indigo-deep transition line-clamp-1">{p.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </div>
              {p.description && <p className="text-sm text-ink-500 line-clamp-2 mb-3">{p.description}</p>}
              <div className="flex items-center gap-4 text-xs text-ink-400">
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-deep">{p.myRole}</span>
                <span className="flex items-center gap-1"><Users className="size-3.5" /> {p.memberCount}</span>
                {p.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {new Date(p.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
