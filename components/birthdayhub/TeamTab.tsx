"use client";

import { useState } from "react";
import type { Employee } from "@/lib/birthdayhub/types";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

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

function fmtBirthday(mmdd: string) {
  const M = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  const [mm, dd] = mmdd.split("-").map(Number);
  return `${M[mm - 1]} ${dd}`;
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  employees: Employee[];
  onAdd: (data: { name: string; email: string; department: string; birthday: string; notes: string }) => void;
  onEdit: (id: string, data: { name: string; email: string; department: string; birthday: string; notes: string }) => void;
  onDelete: (id: string) => void;
  onImport: () => void;
  onCompose: (emp: Employee) => void;
}

const emptyForm = {
  name: "",
  email: "",
  department: "",
  birthMonth: "01",
  birthDay: "01",
  notes: "",
};

/* ------------------------------------------------------------------ */
/*  TeamTab                                                            */
/* ------------------------------------------------------------------ */

export default function TeamTab({
  employees,
  onAdd,
  onEdit,
  onDelete,
  onImport,
  onCompose,
}: Props) {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* departments for datalist */
  const allDepts = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  });

  function handleAdd(ev: React.FormEvent) {
    ev.preventDefault();
    onAdd({
      name: form.name,
      email: form.email,
      department: form.department,
      birthday: `${form.birthMonth}-${form.birthDay}`,
      notes: form.notes,
    });
    setForm(emptyForm);
    setShowAdd(false);
  }

  function startEdit(emp: Employee) {
    const [mm, dd] = emp.birthday.split("-");
    setEditingId(emp.id);
    setEditForm({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      birthMonth: mm,
      birthDay: dd,
      notes: emp.notes ?? "",
    });
  }

  function handleEdit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!editingId) return;
    onEdit(editingId, {
      name: editForm.name,
      email: editForm.email,
      department: editForm.department,
      birthday: `${editForm.birthMonth}-${editForm.birthDay}`,
      notes: editForm.notes,
    });
    setEditingId(null);
    setEditForm(emptyForm);
  }

  function handleDelete(id: string) {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  }

  /* ---- render helper: form fields ---- */
  function renderFormFields(
    f: typeof emptyForm,
    setF: React.Dispatch<React.SetStateAction<typeof emptyForm>>
  ) {
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            placeholder="Full Name"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            className="rounded-lg border bg-secondary px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            className="rounded-lg border bg-secondary px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none"
          />
          <div className="relative">
            <input
              placeholder="Department"
              list="dept-list"
              value={f.department}
              onChange={(e) => setF({ ...f, department: e.target.value })}
              className="w-full rounded-lg border bg-secondary px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none"
            />
            <datalist id="dept-list">
              {allDepts.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div className="flex gap-2">
            <select
              value={f.birthMonth}
              onChange={(e) => setF({ ...f, birthMonth: e.target.value })}
              className="flex-1 rounded-lg border bg-secondary px-2 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={String(i + 1).padStart(2, "0")}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={f.birthDay}
              onChange={(e) => setF({ ...f, birthDay: e.target.value })}
              className="w-20 rounded-lg border bg-secondary px-2 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
        <input
          placeholder="Notes (optional)"
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
          className="w-full rounded-lg border bg-secondary px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none"
        />
      </>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search + actions */}
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
            placeholder="Search by name, email, or department..."
            className="w-full rounded-lg border bg-secondary pl-9 pr-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onImport}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition"
          >
            Import CSV
          </button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
            style={{ backgroundColor: "#2D1B69" }}
          >
            + Add Person
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border bg-card p-5 shadow-sm space-y-3"
        >
          <h4 className="text-sm font-semibold text-foreground">Add New Person</h4>
          {renderFormFields(form, setForm)}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
              style={{ backgroundColor: "#2D1B69" }}
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAdd(false); setForm(emptyForm); }}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Employee grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            {employees.length === 0
              ? "No team members yet. Add your first person above."
              : "No results matching your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((emp) => {
            const dc = deptColor(emp.department);
            const isEditing = editingId === emp.id;

            if (isEditing) {
              return (
                <form
                  key={emp.id}
                  onSubmit={handleEdit}
                  className="rounded-xl border-2 bg-card p-5 space-y-3 shadow-sm"
                  style={{ borderColor: "#2D1B69" }}
                >
                  <h4 className="text-sm font-semibold text-foreground">
                    Edit {emp.name}
                  </h4>
                  {renderFormFields(editForm, setEditForm)}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
                      style={{ backgroundColor: "#2D1B69" }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setEditForm(emptyForm); }}
                      className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={emp.id}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: dc.bg, color: dc.text }}
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
                  <span
                    className="hidden sm:inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ backgroundColor: dc.bg, color: dc.text }}
                  >
                    {emp.department}
                  </span>
                  <span className="hidden md:inline-block text-xs text-muted-foreground">
                    {fmtBirthday(emp.birthday)}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onCompose(emp)}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium transition"
                      style={{ backgroundColor: "#EEEDFE", color: "#2D1B69" }}
                    >
                      Compose
                    </button>
                    <button
                      onClick={() => startEdit(emp)}
                      className="rounded-lg border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                        confirmDeleteId === emp.id
                          ? "border-red-300 bg-red-50 text-red-600"
                          : "border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {confirmDeleteId === emp.id ? "Confirm?" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
