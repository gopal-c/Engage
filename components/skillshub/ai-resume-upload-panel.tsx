"use client";

import { useRef, useState } from "react";
import { Sparkles, FileText, CheckCircle2, UploadCloud, X } from "lucide-react";

const MAX_RESUME_BYTES = 10 * 1024 * 1024;

type Props = {
  existingResume?: { updatedAt: Date | string } | null;
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  onReset?: () => void;
};

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AiResumeUploadPanel({ existingResume, onUpload, isLoading, isSuccess, onReset }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showDropzone, setShowDropzone] = useState(!existingResume);
  const [pickError, setPickError] = useState<string | null>(null);

  function pickFile(f: File | null) {
    setPickError(null);
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setPickError("That doesn't look like a PDF.");
      return;
    }
    if (f.size > MAX_RESUME_BYTES) {
      setPickError("That PDF is too large — we support up to 10 MB.");
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
    setPickError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function replaceResume() {
    setShowDropzone(true);
    clearFile();
    onReset?.();
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={16} className="text-violet-500" />
            <span>AI Resume Extraction</span>
          </div>
          <span className="rounded-full bg-indigo-soft px-2.5 py-0.5 text-[11px] font-medium text-indigo-deep">
            Powered by Groq
          </span>
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Upload a PDF — Groq will read it and fill in this employee&apos;s skills, experience, and
          profile automatically.
        </p>

        {/* Success */}
        {isSuccess ? (
          <div className="mt-4 flex flex-col items-center gap-2 py-6">
            <CheckCircle2 size={28} className="text-green-600" />
            <span className="text-sm font-medium">Profile updated from resume</span>
            <button type="button" onClick={replaceResume} className="text-xs text-primary underline">
              Replace resume
            </button>
          </div>
        ) : isLoading ? (
          <div className="mt-4 py-8">
            <div className="flex animate-pulse flex-col items-center gap-2">
              <Sparkles size={24} className="text-violet-600" />
              <span className="text-sm text-muted-foreground">Extracting profile with Groq&hellip;</span>
            </div>
          </div>
        ) : (
          <>
            {/* Resume-on-file indicator */}
            {existingResume && !showDropzone && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <FileText size={16} />
                <span>Resume on file &middot; last updated {formatDate(existingResume.updatedAt)}</span>
                <button type="button" onClick={() => setShowDropzone(true)} className="ml-auto text-primary underline">
                  Replace
                </button>
              </div>
            )}

            {(!existingResume || showDropzone) && (
              <div className="mt-4">
                {!file ? (
                  <label
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                      dragging
                        ? "border-indigo bg-indigo-soft"
                        : "border-muted-foreground/25 hover:border-indigo"
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
                      className="hidden"
                    />
                    <UploadCloud size={28} className="text-muted-foreground" />
                    <span className="text-sm">
                      Drop resume here or <span className="font-medium text-primary">click to browse</span>
                    </span>
                    <span className="text-xs text-muted-foreground">PDF only &middot; up to 10 MB</span>
                  </label>
                ) : (
                  <>
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-3 py-2">
                      <FileText size={18} className="flex-shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        aria-label="Remove file"
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpload(file)}
                      disabled={isLoading}
                      className="mt-3 w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      Extract &amp; Save Profile
                    </button>
                  </>
                )}
                {pickError && (
                  <p className="mt-2 text-xs text-red-600">{pickError}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
