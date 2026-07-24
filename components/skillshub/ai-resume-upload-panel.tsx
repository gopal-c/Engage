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
    <div className="overflow-hidden rounded-2xl border border-ink-200/60 bg-white shadow-2">
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #5B3DAF 0%, #a78bfa 50%, #5B3DAF 100%)" }} />
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink-800">
              <Sparkles size={18} className="text-indigo-deep" />
              AI Resume Extraction
            </h3>
            <p className="mt-1 text-sm text-ink-500">
              Upload a PDF — Groq will read it and fill in this employee&apos;s skills, experience, and profile automatically.
            </p>
          </div>
          <span className="eyebrow shrink-0 text-[10px] text-indigo-deep">Powered by Groq</span>
        </div>

        {/* Success */}
        {isSuccess ? (
          <div className="mt-6 flex flex-col items-center gap-2 py-8">
            <CheckCircle2 size={28} className="text-teal-deep" />
            <span className="text-sm font-medium text-ink-800">Profile updated from resume</span>
            <button type="button" onClick={replaceResume} className="text-xs text-indigo-deep underline">
              Replace resume
            </button>
          </div>
        ) : isLoading ? (
          <div className="mt-6 py-10">
            <div className="flex animate-pulse flex-col items-center gap-2">
              <Sparkles size={24} className="text-indigo" />
              <span className="text-sm text-ink-500">Extracting profile with Groq&hellip;</span>
            </div>
          </div>
        ) : (
          <>
            {/* Resume-on-file indicator */}
            {existingResume && !showDropzone && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-ink-200/60 bg-ink-50/50 px-4 py-2.5 text-xs text-ink-500">
                <FileText size={16} className="shrink-0" />
                <span>Resume on file &middot; last updated {formatDate(existingResume.updatedAt)}</span>
                <button type="button" onClick={() => setShowDropzone(true)} className="ml-auto text-indigo-deep hover:underline">
                  Replace
                </button>
              </div>
            )}

            {(!existingResume || showDropzone) && (
              <div className="mt-5">
                {!file ? (
                  <label
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                      dragging
                        ? "border-indigo bg-indigo-soft/30"
                        : "border-ink-200/70 hover:border-indigo/40"
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
                    <UploadCloud size={28} className="text-ink-300" />
                    <span className="text-sm text-ink-600">
                      Drop resume here or <span className="font-medium text-indigo-deep">click to browse</span>
                    </span>
                    <span className="text-xs text-ink-400">PDF only &middot; up to 10 MB</span>
                  </label>
                ) : (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border border-ink-200/60 bg-ink-50/50 px-4 py-3">
                      <FileText size={18} className="shrink-0 text-ink-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-800">{file.name}</p>
                        <p className="text-xs text-ink-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        aria-label="Remove file"
                        className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpload(file)}
                      disabled={isLoading}
                      className="mt-4 rounded-xl bg-indigo-deep px-5 py-2 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3 disabled:opacity-50"
                    >
                      Extract profile
                    </button>
                  </>
                )}
                {pickError && (
                  <p className="mt-2 text-xs text-coral-deep">{pickError}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
