"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Employee, SendLog } from "@/lib/birthdayhub/types";

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

const DEPT_COLORS: Record<string, { bg: string; text: string }> = {
  Engineering: { bg: "#EEEDFE", text: "#2D1B69" },
  Marketing:   { bg: "#FAECE7", text: "#993C1D" },
  Design:      { bg: "#E1F5EE", text: "#0F6E56" },
  Sales:       { bg: "#FAEEDA", text: "#854F0B" },
  HR:          { bg: "#FBEAF0", text: "#993556" },
  Finance:     { bg: "#E6F1FB", text: "#185FA5" },
  Product:     { bg: "#EAF3DE", text: "#3B6D11" },
};

function deptColor(dept: string) {
  return DEPT_COLORS[dept] ?? { bg: "#F3F4F6", text: "#374151" };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function todayMMDD() {
  const n = new Date();
  return `${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function currentMonth() {
  return String(new Date().getMonth() + 1).padStart(2, "0");
}

function daysUntil(birthday: string) {
  const now = new Date();
  const [mm, dd] = birthday.split("-").map(Number);
  const thisYear = new Date(now.getFullYear(), mm - 1, dd);
  if (thisYear.getTime() < now.setHours(0, 0, 0, 0)) {
    thisYear.setFullYear(now.getFullYear() + 1);
  }
  return Math.ceil((thisYear.getTime() - Date.now()) / 86_400_000);
}

function fmtBirthday(mmdd: string) {
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const [mm, dd] = mmdd.split("-").map(Number);
  return `${MONTHS[mm - 1]} ${dd}`;
}

function monthLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

/* ------------------------------------------------------------------ */
/*  LogRow                                                             */
/* ------------------------------------------------------------------ */

function LogRow({ log }: { log: SendLog }) {
  const d = new Date(log.sentAt);
  const time = d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-center justify-between py-2 px-1">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`inline-block h-2 w-2 rounded-full shrink-0 ${
            log.status === "sent" ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="truncate text-sm text-gray-700">{log.employeeName}</span>
      </div>
      <span className="text-xs text-gray-400 shrink-0 ml-2">{time}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  employees: Employee[];
  logs: SendLog[];
  onCompose: (emp: Employee) => void;
}

export default function Dashboard({ employees, logs, onCompose }: Props) {
  const today = todayMMDD();
  const month = currentMonth();

  /* Stat calculations */
  const teamCount = employees.length;
  const thisMonthCount = employees.filter((e) => e.birthday.startsWith(month)).length;
  const year = new Date().getFullYear();
  const sentThisYear = logs.filter(
    (l) => l.status === "sent" && l.year === year
  ).length;

  /* Today's birthdays */
  const todayBirthdays = employees.filter((e) => e.birthday === today);

  /* Upcoming (next 6, excluding today) */
  const upcoming = [...employees]
    .filter((e) => e.birthday !== today)
    .sort((a, b) => daysUntil(a.birthday) - daysUntil(b.birthday))
    .slice(0, 6);

  /* Already-sent set for today */
  const sentToday = new Set(
    logs
      .filter((l) => {
        const d = new Date(l.sentAt);
        return (
          l.status === "sent" &&
          d.getFullYear() === year &&
          `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` === today
        );
      })
      .map((l) => l.employeeId)
  );

  /* ---- Recent Emails accordion ---- */
  const [emailsOpen, setEmailsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  const measure = useCallback(() => {
    if (contentRef.current) setContentHeight(contentRef.current.scrollHeight);
  }, []);

  useEffect(() => {
    measure();
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [logs, measure]);

  const recentLogs = [...logs].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  /* Group by month for expanded view */
  const grouped = recentLogs.reduce<Record<string, SendLog[]>>((acc, l) => {
    const key = monthLabel(l.sentAt);
    (acc[key] ??= []).push(l);
    return acc;
  }, {});

  const COLLAPSED_MAX = 4;
  const collapsedLogs = recentLogs.slice(0, COLLAPSED_MAX);

  return (
    <div className="space-y-6">
      {/* ---- Stat cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Team Members", value: teamCount, icon: "👥" },
          { label: "This Month", value: thisMonthCount, icon: "🎂" },
          { label: "Sent This Year", value: sentThisYear, icon: "✉️" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{s.label}</span>
              <span className="text-xl">{s.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-bold" style={{ color: "#2D1B69" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* ---- Today's birthdays ---- */}
      {todayBirthdays.length > 0 && (
        <div
          className="rounded-2xl p-6 text-white"
          style={{
            background: "linear-gradient(135deg, #2D1B69 0%, #5B3DAF 100%)",
          }}
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">🎉</span> Today&apos;s Birthdays
          </h3>
          <div className="mt-4 space-y-3">
            {todayBirthdays.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: "#EF9F27", color: "#2D1B69" }}
                  >
                    {initials(emp.name)}
                  </div>
                  <div>
                    <p className="font-semibold">{emp.name}</p>
                    <p className="text-xs text-white/70">{emp.department}</p>
                  </div>
                </div>
                {sentToday.has(emp.id) ? (
                  <span className="rounded-full bg-green-400/20 px-3 py-1 text-xs font-medium text-green-200">
                    Sent
                  </span>
                ) : (
                  <button
                    onClick={() => onCompose(emp)}
                    className="rounded-lg px-4 py-1.5 text-sm font-semibold transition"
                    style={{ backgroundColor: "#EF9F27", color: "#2D1B69" }}
                  >
                    Send Wishes
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Upcoming birthdays ---- */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-gray-800">
          Upcoming Birthdays
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">No upcoming birthdays</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((emp) => {
              const days = daysUntil(emp.birthday);
              const dc = deptColor(emp.department);
              return (
                <div
                  key={emp.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: dc.bg, color: dc.text }}
                    >
                      {initials(emp.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{emp.name}</p>
                      <p className="text-xs text-gray-400">{fmtBirthday(emp.birthday)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: dc.bg, color: dc.text }}
                    >
                      {emp.department}
                    </span>
                    <span className="text-xs font-medium text-gray-400">
                      {days === 0 ? "Today" : `${days}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Recent emails accordion ---- */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <button
          onClick={() => setEmailsOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <h3 className="text-base font-semibold text-gray-800">Recent Emails</h3>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${emailsOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
          style={{ maxHeight: emailsOpen ? contentHeight + 40 : 180 }}
        >
          <div ref={contentRef} className="px-5 pb-4">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-400">No emails sent yet</p>
            ) : emailsOpen ? (
              /* Expanded: grouped by month */
              Object.entries(grouped).map(([month, items]) => (
                <div key={month} className="mb-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {month}
                  </p>
                  <div className="divide-y divide-gray-50">
                    {items.map((l) => (
                      <LogRow key={l.id} log={l} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              /* Collapsed: first few + fade */
              <div className="relative">
                <div className="divide-y divide-gray-50">
                  {collapsedLogs.map((l) => (
                    <LogRow key={l.id} log={l} />
                  ))}
                </div>
                {recentLogs.length > COLLAPSED_MAX && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
