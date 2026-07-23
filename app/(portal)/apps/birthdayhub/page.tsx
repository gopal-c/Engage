"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { Employee, SendLog, ScheduledSend } from "@/lib/birthdayhub/types";
import Dashboard from "@/components/birthdayhub/Dashboard";
import TeamTab from "@/components/birthdayhub/TeamTab";
import ComposeTab from "@/components/birthdayhub/ComposeTab";
import ScheduledTab from "@/components/birthdayhub/ScheduledTab";
import SettingsTab from "@/components/birthdayhub/SettingsTab";
import ImportModal from "@/components/birthdayhub/ImportModal";

type Tab = "dashboard" | "team" | "compose" | "scheduled" | "settings";

export default function BirthdayHubPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeTarget, setComposeTarget] = useState<Employee | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [scheduledRefreshKey, setScheduledRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  const checkingRef = useRef(false);

  function addToast(text: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, text }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }

  const checkScheduled = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const res = await fetch("/api/birthdayhub/schedule/due");
      if (!res.ok) return;
      const due: ScheduledSend[] = await res.json();
      if (due.length === 0) return;

      let sentCount = 0;
      await Promise.all(
        due.map(async (job) => {
          try {
            const sendRes = await fetch("/api/birthdayhub/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: job.employeeId,
                message: job.message,
                gmailUser: job.gmailUser,
                gmailAppPassword: job.gmailAppPassword,
                fromName: job.fromName,
                mood: job.mood,
                fuel: job.fuel,
                heroImageUrl: job.heroImageUrl,
                paletteId: job.paletteId,
                cc: job.cc,
                ccBehavior: job.ccBehavior || "cc",
                scheduledJobId: job.id,
              }),
            });
            if (sendRes.ok) {
              addToast(`Scheduled email sent to ${job.employeeName}`);
              sentCount++;
            }
          } catch { /* silent */ }
        })
      );

      if (sentCount > 0) {
        setScheduledRefreshKey((k) => k + 1);
      }
    } catch { /* silent */ }
    finally { checkingRef.current = false; }
  }, []);

  const fetchData = useCallback(async () => {
    const [empRes, logRes] = await Promise.all([
      fetch("/api/birthdayhub/employees"),
      fetch("/api/birthdayhub/logs"),
    ]);
    setEmployees(await empRes.json());
    setLogs(await logRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    checkScheduled();
    window.addEventListener("focus", checkScheduled);
    return () => window.removeEventListener("focus", checkScheduled);
  }, [checkScheduled]);

  async function handleAdd(data: Omit<Employee, "id" | "createdAt">) {
    const res = await fetch("/api/birthdayhub/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { alert(`Failed to add employee: ${res.status} ${await res.text()}`); return; }
    const created: Employee = await res.json();
    setEmployees((prev) => [...prev, created]);
  }

  async function handleEdit(id: string, data: Omit<Employee, "id" | "createdAt">) {
    const res = await fetch(`/api/birthdayhub/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { alert(`Failed to update employee: ${res.status} ${await res.text()}`); return; }
    const updated: Employee = await res.json();
    setEmployees((prev) => prev.map((e) => e.id === id ? updated : e));
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/birthdayhub/employees/${id}`, { method: "DELETE" });
    if (!res.ok) { alert(`Failed to delete employee: ${res.status} ${await res.text()}`); return; }
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }

  function handleCompose(emp: Employee) {
    setComposeTarget(emp);
    setTab("compose");
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "dashboard", label: "Dashboard", icon: "🏠" },
    { key: "team",      label: "Team",      icon: "👥" },
    { key: "compose",   label: "Compose",   icon: "✉️" },
    { key: "scheduled", label: "Scheduled", icon: "⏰" },
    { key: "settings",  label: "Settings",  icon: "⚙️" },
  ];

  const todayCount = employees.filter((e) => {
    const n = new Date();
    const today = String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0");
    return e.birthday === today;
  }).length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <nav className="flex items-center gap-1 rounded-full bg-secondary p-1 overflow-x-auto self-start">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => { setTab(key); if (key !== "compose") setComposeTarget(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
              tab === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{icon}</span>
            {label}
            {key === "dashboard" && todayCount > 0 && (
              <span className="w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-semibold"
                style={{ background: "#EF9F27" }}>
                {todayCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <span className="text-2xl animate-spin">&#x1f382;</span>
          <p className="text-sm text-muted-foreground">Loading Birthday Hub...</p>
        </div>
      ) : (
        <>
          {tab === "dashboard" && (
            <Dashboard employees={employees} logs={logs} onCompose={handleCompose} />
          )}
          {tab === "team" && (
            <TeamTab
              employees={employees}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onImport={() => setShowImport(true)}
              onCompose={handleCompose}
            />
          )}
          {tab === "compose" && (
            <ComposeTab
              employees={employees}
              initialEmployee={composeTarget}
              onSent={fetchData}
              onScheduled={() => {
                setScheduledRefreshKey((k) => k + 1);
                setTab("scheduled");
              }}
            />
          )}
          {tab === "scheduled" && (
            <ScheduledTab refreshKey={scheduledRefreshKey} />
          )}
          {tab === "settings" && (
            <SettingsTab />
          )}
        </>
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={async () => {
            await fetchData();
            setShowImport(false);
          }}
        />
      )}

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="bg-foreground text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5"
            >
              {t.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
