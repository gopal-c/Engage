"use client";

import { useState } from "react";
import type { Employee } from "@/lib/birthdayhub/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function fmtBirthday(mmdd: string) {
  const M = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  const [mm, dd] = mmdd.split("-").map(Number);
  return `${M[mm - 1]} ${dd}`;
}

interface Props {
  employees: Employee[];
  excludedEmails?: Set<string>;
  onCompose: (emp: Employee) => void;
}

export default function TeamTab({ employees, excludedEmails = new Set(), onCompose }: Props) {
  const [search, setSearch] = useState("");

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      {/* Search + info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border bg-secondary pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            {employees.length === 0
              ? "No employees with birthdays on file. Add date of birth in SkillsHub profiles."
              : "No results matching your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((emp) => {
            const isExcluded = excludedEmails.has(emp.email.toLowerCase());
            return (
              <div
                key={emp.id}
                className={`flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm${isExcluded ? " opacity-50" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {emp.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={emp.avatarUrl}
                      alt={emp.name}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: "#EEEDFE", color: "#2D1B69" }}
                    >
                      {initials(emp.name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium text-foreground truncate${isExcluded ? " line-through" : ""}`}>
                      {emp.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                  </div>
                  {isExcluded && (
                    <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-red-500">
                      Excluded
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span
                    className="hidden sm:inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "#EEEDFE", color: "#2D1B69" }}
                  >
                    {fmtBirthday(emp.birthday)}
                  </span>
                  {!isExcluded && (
                    <button
                      onClick={() => onCompose(emp)}
                      className="rounded-xl bg-indigo-deep px-3 py-1.5 text-xs font-medium text-white shadow-1 transition-all hover:bg-indigo-press hover:shadow-2"
                    >
                      Compose
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
