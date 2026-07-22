"use client";

import { useState, useEffect } from "react";
import type { AppSettings } from "@/lib/birthdayhub/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function istToUtc(istTime: string): string {
  const [h, m] = istTime.split(":").map(Number);
  let utcH = h - 5;
  let utcM = m - 30;
  if (utcM < 0) {
    utcM += 60;
    utcH -= 1;
  }
  if (utcH < 0) utcH += 24;
  return `${String(utcH).padStart(2, "0")}:${String(utcM).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "" : "bg-muted"
      }`}
      style={checked ? { backgroundColor: "#2D1B69" } : {}}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform shadow-sm ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-primary/20 bg-accent px-4 py-3 text-xs text-primary">
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 rounded-xl bg-secondary" />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SettingsTab                                                        */
/* ------------------------------------------------------------------ */

const defaults: AppSettings = {
  fromName: "The HR Team",
  replyTo: "",
  autoSendEnabled: false,
  sendTimeIST: "09:00",
  sendTimeUTC: "03:30",
  cronExpression: "30 3 * * *",
  ccMode: "all",
  customCCList: [],
  bccOverride: false,
};

export default function SettingsTab() {
  const [settings, setSettings] = useState<AppSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cronStatus, setCronStatus] = useState<string | null>(null);
  const [cronRunning, setCronRunning] = useState(false);
  const [ccInput, setCcInput] = useState("");

  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  /* ---- Load settings ---- */
  useEffect(() => {
    Promise.all([
      fetch("/api/birthdayhub/settings").then((r) => r.json()),
    ])
      .then(([s]) => {
        setSettings({ ...defaults, ...s });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ---- Derived ---- */
  const utcTime = istToUtc(settings.sendTimeIST);

  /* ---- Handlers ---- */
  function updateField<K extends keyof AppSettings>(key: K, val: AppSettings[K]) {
    setSettings((s) => {
      const next = { ...s, [key]: val };
      if (key === "sendTimeIST") {
        const ist = val as string;
        next.sendTimeUTC = istToUtc(ist);
        const [h, m] = istToUtc(ist).split(":").map(Number);
        next.cronExpression = `${m} ${h} * * *`;
      }
      return next;
    });
  }

  function addCcChip(email: string) {
    const e = email.trim();
    if (!e || !e.includes("@")) return;
    if (settings.customCCList.includes(e)) return;
    updateField("customCCList", [...settings.customCCList, e]);
  }

  function removeCcChip(email: string) {
    updateField(
      "customCCList",
      settings.customCCList.filter((c) => c !== email)
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/birthdayhub/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);

        /* Sync cron to GitHub */
        if (settings.autoSendEnabled) {
          fetch("/api/birthdayhub/settings/cron", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cronExpression: settings.cronExpression }),
          }).catch(() => {});
        }
      }
    } catch {
      /* */
    } finally {
      setSaving(false);
    }
  }

  async function handleRunNow() {
    setCronRunning(true);
    setCronStatus(null);
    try {
      const res = await fetch("/api/birthdayhub/settings/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispatch: true }),
      });
      const data = await res.json();
      setCronStatus(res.ok ? "Dispatched! Check GitHub Actions." : data.error ?? "Failed");
    } catch {
      setCronStatus("Network error");
    } finally {
      setCronRunning(false);
    }
  }

  async function handleClearLogs() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setClearing(true);
    try {
      await fetch("/api/birthdayhub/logs", { method: "DELETE" });
    } catch {
      /* */
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  }

  /* ---- Render ---- */

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* ---- Sender Identity ---- */}
      <SectionCard>
        <SectionHeader
          title="Sender Identity"
          subtitle="Name and reply-to address for outgoing emails"
        />
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              From Name
            </label>
            <input
              value={settings.fromName}
              onChange={(e) => updateField("fromName", e.target.value)}
              className="w-full rounded-lg border bg-secondary px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Reply-To
            </label>
            <input
              type="email"
              value={settings.replyTo}
              onChange={(e) => updateField("replyTo", e.target.value)}
              placeholder="hr@company.com"
              className="w-full rounded-lg border bg-secondary px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition"
            />
          </div>
        </div>
      </SectionCard>

      {/* ---- Auto-Send ---- */}
      <SectionCard>
        <SectionHeader
          title="Auto-Send"
          subtitle="Automatically send birthday emails via GitHub Actions cron"
        />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Toggle
              checked={settings.autoSendEnabled}
              onChange={(v) => updateField("autoSendEnabled", v)}
            />
            <span className="text-sm text-muted-foreground">
              {settings.autoSendEnabled
                ? "Enabled -- cron will send automatically"
                : "Disabled -- manual send only"}
            </span>
          </div>

          {settings.autoSendEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Send Time (IST)
                </label>
                <input
                  type="time"
                  value={settings.sendTimeIST}
                  onChange={(e) => updateField("sendTimeIST", e.target.value)}
                  className="w-48 rounded-lg border bg-secondary px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  UTC equivalent: {utcTime}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Cron Expression
                </label>
                <input
                  value={settings.cronExpression}
                  onChange={(e) => updateField("cronExpression", e.target.value)}
                  className="w-64 rounded-lg border bg-secondary px-3 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-ring outline-none transition"
                />
              </div>

              <InfoBox>
                This updates the <code className="font-mono">birthday-cron.yml</code>{" "}
                GitHub Actions workflow. Make sure{" "}
                <code className="font-mono">GITHUB_TOKEN</code> and{" "}
                <code className="font-mono">GITHUB_REPO</code> env vars are set.
              </InfoBox>

              <button
                onClick={handleRunNow}
                disabled={cronRunning}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition disabled:opacity-40"
              >
                {cronRunning ? "Dispatching..." : "Run Auto-Send Now"}
              </button>
              {cronStatus && (
                <p className="text-xs text-muted-foreground">{cronStatus}</p>
              )}
            </>
          )}
        </div>
      </SectionCard>

      {/* ---- CC Configuration ---- */}
      <SectionCard>
        <SectionHeader
          title="CC Configuration"
          subtitle="Who gets CC'd on birthday emails by default"
        />
        <div className="space-y-4">
          {/* Segmented control */}
          <div className="inline-flex rounded-lg border overflow-hidden">
            {(["all", "custom", "none"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateField("ccMode", mode)}
                className={`px-5 py-2 text-sm font-medium capitalize transition ${
                  settings.ccMode === mode
                    ? "text-white"
                    : "bg-card text-muted-foreground hover:bg-secondary"
                }`}
                style={settings.ccMode === mode ? { backgroundColor: "#2D1B69" } : {}}
              >
                {mode}
              </button>
            ))}
          </div>

          {settings.ccMode === "custom" && (
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {settings.customCCList.map((email) => (
                  <span
                    key={email}
                    className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: "#2D1B69" }}
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeCcChip(email)}
                      className="opacity-70 hover:opacity-100"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="email@company.com"
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCcChip(ccInput);
                      setCcInput("");
                    }
                  }}
                  className="flex-1 rounded-lg border bg-secondary px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => {
                    addCcChip(ccInput);
                    setCcInput("");
                  }}
                  className="rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {settings.ccMode === "all" && (
            <p className="text-xs text-muted-foreground">
              All team members will be CC&apos;d on each birthday email.
            </p>
          )}
          {settings.ccMode === "none" && (
            <p className="text-xs text-muted-foreground">
              No one will be CC&apos;d. Emails go to the birthday person only.
            </p>
          )}
        </div>
      </SectionCard>

      {/* ---- Danger Zone ---- */}
      <SectionCard>
        <SectionHeader title="Danger Zone" />
        <button
          onClick={handleClearLogs}
          disabled={clearing}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            confirmClear
              ? "border-red-300 bg-red-50 text-red-600"
              : "border text-muted-foreground hover:bg-secondary"
          }`}
        >
          {clearing
            ? "Clearing..."
            : confirmClear
            ? "Are you sure? Click again to confirm"
            : "Clear All Logs"}
        </button>
      </SectionCard>

      {/* ---- Save button ---- */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: "#2D1B69" }}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">
            Settings saved
          </span>
        )}
      </div>
    </div>
  );
}
