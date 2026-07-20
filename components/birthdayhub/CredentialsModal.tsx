"use client";

import { useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Exported types                                                     */
/* ------------------------------------------------------------------ */

export type CcBehavior = "cc" | "bcc" | "none";

export interface CcPerson {
  email: string;
  name?: string;
}

export interface SendCredentials {
  gmailUser: string;
  gmailAppPassword: string;
  fromName: string;
  remember: boolean;
}

/* ------------------------------------------------------------------ */
/*  SessionStorage helpers                                             */
/* ------------------------------------------------------------------ */

const CREDS_KEY = "birthdayhub_credentials";

export function loadCredentials(): SendCredentials | null {
  try {
    const raw = sessionStorage.getItem(CREDS_KEY);
    return raw ? (JSON.parse(raw) as SendCredentials) : null;
  } catch {
    return null;
  }
}

export function saveCredentials(creds: SendCredentials) {
  try {
    sessionStorage.setItem(CREDS_KEY, JSON.stringify(creds));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface Props {
  ccList: CcPerson[];
  onConfirm: (
    creds: SendCredentials,
    cc: CcPerson[],
    scheduledAt: string | null,
    ccBehavior: CcBehavior
  ) => void;
  onCancel: () => void;
}

export default function CredentialsModal({ ccList, onConfirm, onCancel }: Props) {
  const [gmailUser, setGmailUser] = useState("");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [fromName, setFromName] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [selectedCc, setSelectedCc] = useState<CcPerson[]>([...ccList]);
  const [ccBehavior, setCcBehavior] = useState<CcBehavior>("cc");

  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");

  /* Pre-fill from saved creds + settings */
  useEffect(() => {
    const saved = loadCredentials();
    if (saved) {
      setGmailUser(saved.gmailUser);
      setGmailAppPassword(saved.gmailAppPassword);
      setFromName(saved.fromName);
      setRemember(saved.remember);
    }
    /* Fetch settings for fromName fallback and ccMode */
    fetch("/api/birthdayhub/settings")
      .then((r) => r.json())
      .then((s) => {
        if (!saved?.fromName && s.fromName) setFromName(s.fromName);
        if (s.ccMode === "none") {
          setCcBehavior("none");
          setSelectedCc([]);
        } else if (s.ccMode === "custom" && s.customCCList?.length) {
          setSelectedCc(
            s.customCCList.map((email: string) => ({ email }))
          );
        }
      })
      .catch(() => {});
  }, []);

  function toggleCc(person: CcPerson) {
    setSelectedCc((prev) =>
      prev.find((p) => p.email === person.email)
        ? prev.filter((p) => p.email !== person.email)
        : [...prev, person]
    );
  }

  function selectAllCc() {
    setSelectedCc([...ccList]);
  }
  function removeAllCc() {
    setSelectedCc([]);
  }

  function handleSubmit() {
    const creds: SendCredentials = { gmailUser, gmailAppPassword, fromName, remember };
    if (remember) saveCredentials(creds);

    let scheduledAt: string | null = null;
    if (scheduleEnabled && scheduleDate && scheduleTime) {
      scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    }

    onConfirm(creds, ccBehavior === "none" ? [] : selectedCc, scheduledAt, ccBehavior);
  }

  const isValid = gmailUser.includes("@") && gmailAppPassword.length >= 8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Send Configuration</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* From Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              From Name
            </label>
            <input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="The HR Team"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#2D1B69] focus:ring-1 focus:ring-[#2D1B69] outline-none transition"
            />
          </div>

          {/* CC Chips */}
          {ccList.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">CC Recipients</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllCc}
                    className="text-xs font-medium"
                    style={{ color: "#2D1B69" }}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={removeAllCc}
                    className="text-xs font-medium text-gray-400 hover:text-gray-600"
                  >
                    Remove all
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ccList.map((p) => {
                  const active = selectedCc.some((s) => s.email === p.email);
                  return (
                    <button
                      key={p.email}
                      type="button"
                      onClick={() => toggleCc(p)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        active
                          ? "text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                      style={active ? { backgroundColor: "#2D1B69" } : {}}
                    >
                      {p.name || p.email}
                      {active && (
                        <span className="ml-1.5 inline-block opacity-70">&times;</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CC Behavior */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              CC Behavior
            </label>
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              {(["cc", "bcc", "none"] as CcBehavior[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setCcBehavior(b)}
                  className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    ccBehavior === b
                      ? "text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                  style={ccBehavior === b ? { backgroundColor: "#2D1B69" } : {}}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule toggle */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => setScheduleEnabled((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  scheduleEnabled ? "" : "bg-gray-200"
                }`}
                style={scheduleEnabled ? { backgroundColor: "#2D1B69" } : {}}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                    scheduleEnabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700">Schedule Send</span>
            </div>
            {scheduleEnabled && (
              <div className="flex gap-2 mt-1">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#2D1B69] focus:ring-1 focus:ring-[#2D1B69] outline-none"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-28 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#2D1B69] focus:ring-1 focus:ring-[#2D1B69] outline-none"
                />
              </div>
            )}
          </div>

          {/* Gmail credentials */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Gmail Address
              </label>
              <input
                type="email"
                value={gmailUser}
                onChange={(e) => setGmailUser(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#2D1B69] focus:ring-1 focus:ring-[#2D1B69] outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                App Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={gmailAppPassword}
                  onChange={(e) => setGmailAppPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-sm focus:border-[#2D1B69] focus:ring-1 focus:ring-[#2D1B69] outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.72 11.72 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829M17.657 17.657L21 21m-3.343-3.343l-2.829-2.829M9.878 9.878a3 3 0 004.243 4.243" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7c-1.274 4.057-5.065 7-9.542 7s-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                style={{ accentColor: "#2D1B69" }}
              />
              <span className="text-xs text-gray-500">
                Remember for this session (sessionStorage)
              </span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
            style={{ backgroundColor: "#2D1B69" }}
          >
            {scheduleEnabled ? "Schedule" : "Send Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
