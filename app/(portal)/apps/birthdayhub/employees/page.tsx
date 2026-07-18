"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  birthday: string;
  notes: string | null;
}

const emptyForm = { name: "", email: "", department: "", birthday: "", notes: "" };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [csvText, setCsvText] = useState("");
  const [showImport, setShowImport] = useState(false);

  async function fetchEmployees() {
    setLoading(true);
    const res = await fetch("/api/birthdayhub/employees");
    const data = await res.json();
    setEmployees(data.employees ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchEmployees(); }, []);

  function flash(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const url = editingId
      ? `/api/birthdayhub/employees/${editingId}`
      : "/api/birthdayhub/employees";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      flash(editingId ? "Employee updated" : "Employee added");
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchEmployees();
    } else {
      const data = await res.json();
      flash(data.error || "Failed to save");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this employee?")) return;
    const res = await fetch(`/api/birthdayhub/employees/${id}`, { method: "DELETE" });
    if (res.ok) {
      flash("Employee deleted");
      fetchEmployees();
    }
  }

  function startEdit(emp: Employee) {
    setForm({
      name: emp.name,
      email: emp.email,
      department: emp.department || "",
      birthday: emp.birthday,
      notes: emp.notes || "",
    });
    setEditingId(emp.id);
    setShowForm(true);
  }

  async function handleImport() {
    if (!csvText.trim()) return;
    setSaving(true);
    const res = await fetch("/api/birthdayhub/employees/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv: csvText }),
    });
    const data = await res.json();
    flash(`Imported ${data.imported}/${data.total}${data.errors?.length ? ` (${data.errors.length} errors)` : ""}`);
    setCsvText("");
    setShowImport(false);
    fetchEmployees();
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/apps/birthdayhub" className="text-muted-foreground hover:text-foreground">
              BirthdayHub
            </Link>
            <span className="text-muted-foreground">/</span>
            <h2 className="text-2xl font-semibold">Employees</h2>
          </div>
          <p className="mt-1 text-muted-foreground">{employees.length} employees</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowImport(!showImport); setShowForm(false); }}
          >
            CSV Import
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setShowForm(!showForm);
              setShowImport(false);
              setEditingId(null);
              setForm(emptyForm);
            }}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {message && (
        <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
      )}

      {showImport && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">CSV Import</p>
          <p className="text-xs text-muted-foreground">
            Format: name, email, department, birthday (MM-DD), notes
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={5}
            placeholder={"John Doe, john@company.com, Engineering, 03-15, Loves cake"}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="sm" onClick={handleImport} disabled={saving}>
            {saving ? "Importing..." : "Import"}
          </Button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">
            {editingId ? "Edit Employee" : "Add Employee"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              placeholder="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              required
              placeholder="Birthday (MM-DD)"
              pattern="\d{2}-\d{2}"
              value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })}
              className="rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <input
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <Button size="sm" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No employees yet</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Dept</th>
                <th className="px-4 py-3 text-left font-medium">Birthday</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{emp.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.department || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.birthday}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => startEdit(emp)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(emp.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
