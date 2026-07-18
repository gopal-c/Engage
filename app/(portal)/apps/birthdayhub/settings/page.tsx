"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X } from "lucide-react";

interface Settings {
  from_name: string;
  auto_send: boolean;
  cc_list: string[];
  bcc_list: string[];
  cron_time: string;
}

const defaults: Settings = {
  from_name: "BirthdayHub",
  auto_send: true,
  cc_list: [],
  bcc_list: [],
  cron_time: "09:00",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");

  useEffect(() => {
    fetch("/api/birthdayhub/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings({
            from_name: data.settings.from_name ?? defaults.from_name,
            auto_send: data.settings.auto_send ?? defaults.auto_send,
            cc_list: data.settings.cc_list ?? defaults.cc_list,
            bcc_list: data.settings.bcc_list ?? defaults.bcc_list,
            cron_time: data.settings.cron_time ?? defaults.cron_time,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/birthdayhub/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings }),
    });
    if (res.ok) {
      setMessage("Settings saved");
      setTimeout(() => setMessage(""), 3000);
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to save");
    }
    setSaving(false);
  }

  function addChip(type: "cc_list" | "bcc_list", value: string) {
    const email = value.trim();
    if (!email || !email.includes("@")) return;
    if (settings[type].includes(email)) return;
    setSettings({ ...settings, [type]: [...settings[type], email] });
  }

  function removeChip(type: "cc_list" | "bcc_list", email: string) {
    setSettings({ ...settings, [type]: settings[type].filter((e) => e !== email) });
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/apps/birthdayhub" className="text-muted-foreground hover:text-foreground">
          BirthdayHub
        </Link>
        <span className="text-muted-foreground">/</span>
        <h2 className="text-2xl font-semibold">Settings</h2>
      </div>

      {message && (
        <p className="text-sm text-green-600 dark:text-green-400">{message}</p>
      )}

      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <label className="text-sm font-medium">From Name</label>
          <input
            value={settings.from_name}
            onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
            className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Auto-send Emails</label>
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, auto_send: !settings.auto_send })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.auto_send ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.auto_send ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {settings.auto_send ? "Enabled — cron will send automatically" : "Disabled — manual send only"}
            </span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Cron Time (IST)</label>
          <input
            type="time"
            value={settings.cron_time}
            onChange={(e) => setSettings({ ...settings, cron_time: e.target.value })}
            className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div>
          <label className="text-sm font-medium">CC Recipients</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {settings.cc_list.map((email) => (
              <span key={email} className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                {email}
                <button type="button" onClick={() => removeChip("cc_list", email)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-1.5 flex gap-2">
            <input
              placeholder="Add CC email"
              value={ccInput}
              onChange={(e) => setCcInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addChip("cc_list", ccInput); setCcInput(""); }
              }}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button size="sm" variant="outline" type="button" onClick={() => { addChip("cc_list", ccInput); setCcInput(""); }}>
              Add
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">BCC Recipients</label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {settings.bcc_list.map((email) => (
              <span key={email} className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                {email}
                <button type="button" onClick={() => removeChip("bcc_list", email)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-1.5 flex gap-2">
            <input
              placeholder="Add BCC email"
              value={bccInput}
              onChange={(e) => setBccInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addChip("bcc_list", bccInput); setBccInput(""); }
              }}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button size="sm" variant="outline" type="button" onClick={() => { addChip("bcc_list", bccInput); setBccInput(""); }}>
              Add
            </Button>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
