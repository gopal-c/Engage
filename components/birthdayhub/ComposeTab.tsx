"use client";

import { useState, useEffect, useRef } from "react";
import type { Employee } from "@/lib/birthdayhub/types";
import CredentialsModal, {
  type CcPerson,
  type SendCredentials,
  type CcBehavior,
} from "./CredentialsModal";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  employees: Employee[];
  initialEmployee?: Employee | null;
  onSent: () => void;
  onScheduled?: () => void;
}

/* ------------------------------------------------------------------ */
/*  ComposeTab                                                         */
/* ------------------------------------------------------------------ */

export default function ComposeTab({
  employees,
  initialEmployee,
  onSent,
  onScheduled,
}: Props) {
  /* ---- state ---- */
  const [selectedId, setSelectedId] = useState(initialEmployee?.id ?? "");
  const [message, setMessage] = useState("");
  const [mood, setMood] = useState("Sunny");
  const [fuel, setFuel] = useState("Coffee");
  const [imageUrl, setImageUrl] = useState("");
  const [paletteId, setPaletteId] = useState("");
  const [fromName, setFromName] = useState("The HR Team");

  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showSource, setShowSource] = useState(false);

  const [status, setStatus] = useState<"idle" | "sent" | "scheduled" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showCreds, setShowCreds] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selected = employees.find((e) => e.id === selectedId) ?? null;

  /* ---- auto-select initial employee ---- */
  useEffect(() => {
    if (initialEmployee) {
      setSelectedId(initialEmployee.id);
      handleGenerate(initialEmployee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEmployee?.id]);

  /* ---- helpers ---- */

  async function handleGenerate(emp?: Employee | null) {
    const target = emp ?? selected;
    if (!target) return;
    setGenerating(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      /* Generate message */
      const genRes = await fetch("/api/birthdayhub/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: target.name,
          department: target.department,
          notes: target.notes,
        }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error ?? "Generation failed");

      setMessage(genData.message ?? "");
      setMood(genData.mood ?? "Sunny");
      setFuel(genData.fuel ?? "Coffee");

      /* Fetch illustration */
      const illRes = await fetch("/api/birthdayhub/illustration");
      const illData = await illRes.json();
      setImageUrl(illData.imageUrl ?? "");

      /* Fetch preview */
      await refreshPreview(
        target,
        genData.message,
        genData.mood,
        genData.fuel,
        illData.imageUrl
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Generation failed");
      setStatus("error");
    } finally {
      setGenerating(false);
    }
  }

  async function refreshPreview(
    emp: Employee,
    msg: string,
    m: string,
    f: string,
    img?: string
  ) {
    try {
      const res = await fetch("/api/birthdayhub/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: emp.name,
          department: emp.department,
          message: msg,
          fromName,
          mood: m,
          fuel: f,
          imageUrl: img || imageUrl,
          paletteId: paletteId || undefined,
        }),
      });
      const data = await res.json();
      setPreviewHtml(data.html ?? "");
      if (data.imageUrl) setImageUrl(data.imageUrl);
      if (data.paletteId) setPaletteId(data.paletteId);
    } catch {
      /* preview is optional */
    }
  }

  function handleSelectEmployee(id: string) {
    setSelectedId(id);
    setMessage("");
    setPreviewHtml("");
    setStatus("idle");
    setErrorMsg("");

    const emp = employees.find((e) => e.id === id);
    if (emp) handleGenerate(emp);
  }

  /* ---- send / schedule flow ---- */

  function handleSendClick() {
    setShowCreds(true);
  }

  async function handleConfirm(
    creds: SendCredentials,
    cc: CcPerson[],
    scheduledAt: string | null,
    ccBehavior: CcBehavior
  ) {
    setShowCreds(false);
    if (!selected) return;

    const ccEmails = cc.map((p) => p.email);

    if (scheduledAt) {
      /* Schedule */
      try {
        const res = await fetch("/api/birthdayhub/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: selected.id,
            employeeName: selected.name,
            employeeEmail: selected.email,
            message,
            gmailUser: creds.gmailUser,
            gmailAppPassword: creds.gmailAppPassword,
            fromName: creds.fromName || fromName,
            cc: ccEmails,
            ccBehavior,
            mood,
            fuel,
            heroImageUrl: imageUrl,
            paletteId,
            scheduledAt,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Scheduling failed");
        }
        setStatus("scheduled");
        onScheduled?.();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Scheduling failed");
        setStatus("error");
      }
    } else {
      /* Send immediately */
      try {
        const res = await fetch("/api/birthdayhub/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: selected.id,
            message,
            gmailUser: creds.gmailUser,
            gmailAppPassword: creds.gmailAppPassword,
            fromName: creds.fromName || fromName,
            cc: ccEmails,
            ccBehavior,
            mood,
            fuel,
            heroImageUrl: imageUrl,
            paletteId,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Send failed");
        }
        setStatus("sent");
        onSent();
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Send failed");
        setStatus("error");
      }
    }
  }

  function copyHtml() {
    navigator.clipboard.writeText(previewHtml).catch(() => {});
  }

  function openGmailDraft() {
    if (!selected) return;
    const subject = encodeURIComponent(`Happy Birthday, ${selected.name}!`);
    const body = encodeURIComponent(message);
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&to=${selected.email}&su=${subject}&body=${body}`,
      "_blank"
    );
  }

  /* ---- render ---- */

  return (
    <div className="space-y-5">
      {/* Status banners */}
      {status === "sent" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          Email sent successfully!
        </div>
      )}
      {status === "scheduled" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
          Email scheduled successfully!
        </div>
      )}
      {status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Employee dropdown */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Select Employee
        </label>
        <select
          value={selectedId}
          onChange={(e) => handleSelectEmployee(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-[#2D1B69] focus:ring-1 focus:ring-[#2D1B69] outline-none transition"
        >
          <option value="">Choose an employee...</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} -- {emp.email} ({emp.birthday})
            </option>
          ))}
        </select>

        {selected && (
          <div className="mt-3 rounded-lg bg-gray-50 border border-gray-100 p-3">
            <p className="text-sm font-medium text-gray-700">{selected.name}</p>
            <p className="text-xs text-gray-400">
              {selected.email} &middot; {selected.department} &middot;{" "}
              {selected.birthday}
            </p>
            {selected.notes && (
              <p className="text-xs text-gray-400 mt-1">Notes: {selected.notes}</p>
            )}
          </div>
        )}

        {/* Generate / Regenerate */}
        {selected && !generating && !message && (
          <button
            onClick={() => handleGenerate()}
            className="mt-3 rounded-lg px-5 py-2 text-sm font-semibold text-white transition"
            style={{ backgroundColor: "#2D1B69" }}
          >
            Generate Birthday Message
          </button>
        )}
        {generating && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating with AI...
          </div>
        )}
      </div>

      {/* Message editor */}
      {message && selected && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Message</h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: "#EEEDFE", color: "#2D1B69" }}
              >
                {mood}
              </span>
              <span
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: "#FFF7E6", color: "#854F0B" }}
              >
                {fuel}
              </span>
            </div>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm leading-relaxed focus:border-[#2D1B69] focus:ring-1 focus:ring-[#2D1B69] outline-none transition resize-y"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleGenerate()}
              disabled={generating}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
            >
              Regenerate
            </button>
            <button
              onClick={() => selected && refreshPreview(selected, message, mood, fuel)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Refresh Preview
            </button>
          </div>
        </div>
      )}

      {/* Email preview */}
      {previewHtml && selected && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <h3 className="text-sm font-semibold text-gray-700">Email Preview</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSource((v) => !v)}
                className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 transition"
              >
                {showSource ? "Visual" : "Source"}
              </button>
              <button
                onClick={copyHtml}
                className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 transition"
              >
                Copy HTML
              </button>
              <button
                onClick={openGmailDraft}
                className="rounded border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 transition"
              >
                Open Gmail Draft
              </button>
            </div>
          </div>

          {showSource ? (
            <pre className="max-h-96 overflow-auto bg-gray-50 p-4 text-xs text-gray-600 font-mono whitespace-pre-wrap">
              {previewHtml}
            </pre>
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              title="Email Preview"
              className="w-full border-0"
              style={{ minHeight: 500 }}
              sandbox="allow-same-origin"
            />
          )}
        </div>
      )}

      {/* Action buttons */}
      {message && selected && (
        <div className="flex gap-3">
          <button
            onClick={handleSendClick}
            className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#2D1B69" }}
          >
            Send Email
          </button>
        </div>
      )}

      {/* Credentials modal */}
      {showCreds && (
        <CredentialsModal
          ccList={[]}
          onConfirm={handleConfirm}
          onCancel={() => setShowCreds(false)}
        />
      )}
    </div>
  );
}
