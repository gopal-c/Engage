"use client";

import { useState } from "react";
import Link from "next/link";
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
  onCompose: (emp: Employee) => void;
}

export default function TeamTab({ employees, onCompose }: Props) {
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
            placeholder="Search by name, email, or city..."
            className="w-full rounded-lg border bg-secondary pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition"
          />
        </div>
        <Link
          href="/apps/skillshub/employees"
          className="shrink-0 rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition"
        >
          Manage in SkillsHub
        </Link>
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
          {filtered.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: "#EEEDFE", color: "#2D1B69" }}
                >
                  {initials(emp.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {emp.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-3">
                {emp.city && (
                  <span
                    className="hidden sm:inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: "#EEEDFE", color: "#2D1B69" }}
                  >
                    {emp.city}
                  </span>
                )}
                <span className="hidden md:inline-block text-xs text-muted-foreground">
                  {fmtBirthday(emp.birthday)}
                </span>
                <button
                  onClick={() => onCompose(emp)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium transition"
                  style={{ backgroundColor: "#EEEDFE", color: "#2D1B69" }}
                >
                  Compose
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
