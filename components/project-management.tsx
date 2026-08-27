"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Search, Trash2, Users, Calendar, FolderKanban } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

interface Project {
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
}

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-slate-50 text-slate-700",
  active: "bg-emerald-50 text-emerald-700",
  on_hold: "bg-amber-50 text-amber-700",
  completed: "bg-blue-50 text-blue-700",
  archived: "bg-zinc-50 text-zinc-500",
};

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchProjects() {
    setLoading(true);
    fetch("/api/projectshub/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchProjects(); }, []);

  const filtered = useMemo(() => {
    let list = projects;
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.department ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [projects, search, statusFilter]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        toast.success(`"${deleteTarget.name}" deleted`);
        setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete project");
    }
    setDeleting(false);
    setDeleteTarget(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-ink-800 flex items-center gap-2">
          <FolderKanban className="size-5 text-indigo-deep" />
          Projects ({projects.length})
        </h2>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search by name or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-ink-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-ink-200/60 bg-ink-0/70 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-ink-400">Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-400">
            {projects.length === 0 ? "No projects found" : "No projects match your filters"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200/60 text-left">
                  <th className="px-4 py-3 font-medium text-ink-500">Project</th>
                  <th className="px-4 py-3 font-medium text-ink-500">Status</th>
                  <th className="px-4 py-3 font-medium text-ink-500">Department</th>
                  <th className="px-4 py-3 font-medium text-ink-500">Members</th>
                  <th className="px-4 py-3 font-medium text-ink-500">Created</th>
                  <th className="px-4 py-3 font-medium text-ink-500 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50/50 transition">
                    <td className="px-4 py-3">
                      <Link href={`/apps/projectshub/${p.id}`} className="font-medium text-ink-800 hover:text-indigo-deep transition">
                        {p.name}
                      </Link>
                      {p.description && (
                        <p className="text-xs text-ink-400 line-clamp-1 mt-0.5">{p.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? ""}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-600">{p.department ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-ink-600">
                        <Users className="size-3.5" /> {p.memberCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition"
                        title="Delete project"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and all its members, milestones, channels, and messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
