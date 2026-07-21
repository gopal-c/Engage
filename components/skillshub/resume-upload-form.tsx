"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Upload as UploadIcon, FileText, X } from "lucide-react";

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB — mirrors lib/extract.ts

type Props = {
  /** Route to POST the multipart form to. */
  endpoint: string;
  /** Extra string fields appended to the FormData alongside `file` (e.g. a pre-approval token). */
  extraFields?: Record<string, string>;
  heading?: string;
  lede?: string;
  submitIdleLabel?: string;
  submitBusyLabel?: string;
  onSuccess: (data: Record<string, unknown>) => void;
  onError?: (message: string) => void;
};

/**
 * The dropzone + file-row + submit UI shared by every resume upload entry
 * point: /upload (employee self-update), the /verify-email pre-approval
 * upload, and HR's replace-resume action in the review/edit form. Only the
 * endpoint, extra fields, and copy change between call sites.
 */
export function ResumeUploadForm({
  endpoint,
  extraFields,
  heading = "Upload a resume",
  lede = "PDF only, please. We'll handle the rest.",
  submitIdleLabel = "Extract & submit →",
  submitBusyLabel = "Extracting…",
  onSuccess,
  onError,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  function pickFile(f: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("That doesn't look like a PDF.");
      return;
    }
    if (f.size > MAX_RESUME_BYTES) {
      toast.error("That PDF is too large — we support up to 10 MB.");
      return;
    }
    setFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      for (const [k, v] of Object.entries(extraFields ?? {})) fd.append(k, v);
      try {
        const res = await fetch(endpoint, { method: "POST", body: fd });
        const data = await res.json();
        if (!data.ok) {
          const message = data.error ?? "Couldn't read that resume.";
          toast.error(message);
          onError?.(message);
          return;
        }
        onSuccess(data);
      } catch {
        toast.error("Network error — try again.");
        onError?.("Network error — try again.");
      }
    });
  }

  return (
    <section className="form-card">
      <h2>{heading}</h2>
      <p className="lede">{lede}</p>

      <label className="field-label">Resume PDF</label>

      <form onSubmit={handleSubmit}>
        <label
          className={`dropzone ${dragging ? "dragging" : ""}`}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            disabled={isPending}
          />
          <span className="dz-icon">
            <UploadIcon />
          </span>
          <div className="dz-title">
            Drag &amp; drop your resume, or <b>click to choose</b>
          </div>
          <div className="dz-hint">A clean PDF works best. We support up to 10 MB.</div>
          <div className="dz-meta">
            <span>PDF only</span><span className="pip"></span>
            <span>10 MB max</span><span className="pip"></span>
            <span>Single file</span>
          </div>
        </label>

        {file && (
          <div className="file-row">
            <span className="file-icon">
              <FileText className="size-[18px]" />
            </span>
            <div>
              <div className="file-name">{file.name}</div>
              <div className="file-meta">
                {(file.size / (1024 * 1024)).toFixed(2)} MB · {isPending ? "Extracting…" : "Ready to extract"}
              </div>
            </div>
            <button
              type="button"
              className="file-clear"
              onClick={clearFile}
              aria-label="Remove file"
              disabled={isPending}
            >
              <X className="size-[14px]" />
            </button>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={!file || isPending}>
            {isPending ? submitBusyLabel : submitIdleLabel}
          </button>
        </div>
      </form>
    </section>
  );
}
