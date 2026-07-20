"use client";

import { useState, useEffect, useCallback } from "react";
import type { ScheduledSend } from "@/lib/birthdayhub/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "any moment";
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  const days = Math.round(hrs / 24);
  return `in ${days}d`;
}

function fmtDatetime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  ScheduledTab                                                       */
/* ------------------------------------------------------------------ */

interface Props {
  refreshKey?: number;
}

export default function ScheduledTab({ refreshKey }: Props) {
  const [jobs, setJobs] = useState<ScheduledSend[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/birthdayhub/schedule");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshKey]);

  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/birthdayhub/schedule/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
      }
    } catch {
      /* */
    } finally {
      setCancellingId(null);
    }
  }

  /* ---- Render ---- */

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">
          Scheduled Emails
        </h3>
        <button
          onClick={fetchJobs}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition"
        >
          <svg
            className="inline-block h-3.5 w-3.5 mr-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Empty state */}
      {jobs.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm text-gray-400">No scheduled emails</p>
        </div>
      ) : (
        /* Table */
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Scheduled For
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    CC
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">
                        {job.employeeName}
                      </p>
                      <p className="text-xs text-gray-400">{job.employeeEmail}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-700">{fmtDatetime(job.scheduledAt)}</p>
                      <p className="text-xs text-gray-400">
                        {relativeTime(job.scheduledAt)}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-gray-700">{job.fromName}</p>
                      <p className="text-xs text-gray-400">{job.gmailUser}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: "#EEEDFE", color: "#2D1B69" }}
                      >
                        {job.cc?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleCancel(job.id)}
                        disabled={cancellingId === job.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-40"
                      >
                        {cancellingId === job.id ? "Cancelling..." : "Cancel"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
