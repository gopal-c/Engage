"use client";

import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";
import { Upload as UploadIcon, FileText, X } from "lucide-react";

const MAX_RESUME_BYTES = 10 * 1024 * 1024;

type Props = {
  endpoint: string;
  extraFields?: Record<string, string>;
  heading?: string;
  lede?: string;
  submitIdleLabel?: string;
  submitBusyLabel?: string;
  onSuccess: (data: Record<string, unknown>) => void;
  onError?: (message: string) => void;
};

export function ResumeUploadForm({
  endpoint,
  extraFields,
  heading = "Upload a resume",
  lede = "PDF only, please. We'll handle the rest.",
  submitIdleLabel = "Extract & submit",
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
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{heading}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{lede}</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <label
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
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
            className="hidden"
          />
          <UploadIcon className="size-8 text-muted-foreground" />
          <p className="text-sm">
            Drag & drop your resume, or <span className="font-medium text-primary">click to choose</span>
          </p>
          <p className="text-xs text-muted-foreground">PDF only · 10 MB max · Single file</p>
        </label>

        {file && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2">
            <FileText className="size-5 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB · {isPending ? "Extracting…" : "Ready to extract"}
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              aria-label="Remove file"
              disabled={isPending}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? submitBusyLabel : submitIdleLabel}
        </button>
      </form>
    </div>
  );
}
