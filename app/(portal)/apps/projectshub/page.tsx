"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, FolderKanban, Users, Calendar, ChevronDown } from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  department: string | null;
  requiredSkills: string[];
  startDate: string | null;
  endDate: string | null;
  memberCount: number;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-slate-50 text-slate-700 border-slate-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-zinc-50 text-zinc-500 border-zinc-200",
};

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export default function ProjectsHubPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search.trim()) params.set("search", search.trim());

    try {
      const res = await fetch(`/api/projectshub/projects?${params}`);
      const data = await res.json();
      setProjects(data.projects ?? []);
      if (data.canManage !== undefined) setCanManage(data.canManage);
    } catch { /* */ }
    setLoading(false);
  }, [status, search]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-800 flex items-center gap-2">
            <FolderKanban className="size-6 text-indigo-deep" />
            ProjectsHub
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">Browse and join projects across the organization</p>
        </div>
        {canManage && (
          <Link
            href="/apps/projectshub/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-deep px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-press transition shadow-sm"
          >
            <Plus className="size-4" /> New Project
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm hover:bg-ink-50 transition"
          >
            {status ? STATUS_LABELS[status] : "All Statuses"}
            <ChevronDown className="size-3.5 text-ink-400" />
          </button>
          {showStatusDropdown && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-ink-200 rounded-xl shadow-lg py-1 min-w-[140px]">
              <button onClick={() => { setStatus(""); setShowStatusDropdown(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50">All Statuses</button>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <button key={val} onClick={() => { setStatus(val); setShowStatusDropdown(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-ink-50">{label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 space-y-3" style={{ borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white p-10 text-center" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <FolderKanban className="size-10 text-ink-300 mx-auto mb-3" />
          <p className="text-lg font-semibold text-ink-800 mb-1">No projects yet</p>
          <p className="text-sm text-ink-500 mb-4">{canManage ? "Create the first project to get started" : "No projects available yet"}</p>
          {canManage && (
            <Link
              href="/apps/projectshub/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-deep px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-press transition shadow-sm"
            >
              <Plus className="size-4" /> New Project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/apps/projectshub/${project.id}`}
              className="bg-white p-5 hover:shadow-md transition group"
              style={{ borderRadius: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-ink-800 group-hover:text-indigo-deep transition line-clamp-1">
                  {project.name}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status] ?? STATUS_COLORS.planning}`}>
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
              </div>

              {project.description && (
                <p className="text-sm text-ink-500 line-clamp-2 mb-3">{project.description}</p>
              )}

              <div className="flex items-center gap-4 text-xs text-ink-400">
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" /> {project.memberCount} member{project.memberCount !== 1 ? "s" : ""}
                </span>
                {project.department && (
                  <span>{project.department}</span>
                )}
                {project.startDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" /> {new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>

              {project.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {project.requiredSkills.slice(0, 4).map((skill) => (
                    <span key={skill} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-deep border border-indigo-100">
                      {skill}
                    </span>
                  ))}
                  {project.requiredSkills.length > 4 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ink-50 text-ink-500">
                      +{project.requiredSkills.length - 4}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
