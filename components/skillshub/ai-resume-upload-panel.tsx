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
    <div className="glass-surface overflow-hidden rounded-2xl border border-white/70 shadow-2">
      <div className="p-6">
        {/* Header */}
        <h3 className="text-ink-800">Onboard from resume</h3>
        <p className="mt-1 text-sm text-ink-500">
          PDF only, please. We&apos;ll extract the candidate&apos;s profile.
        </p>

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
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-ink-200/60 bg-ink-100/50 px-3 py-2 text-xs text-ink-500">
                <FileText size={16} />
                <span>Resume on file &middot; last updated {formatDate(existingResume.updatedAt)}</span>
                <button type="button" onClick={() => setShowDropzone(true)} className="ml-auto text-indigo-deep underline">
                  Replace
                </button>
              </div>
            )}

            {(!existingResume || showDropzone) && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-ink-700">Resume PDF</p>
                {!file ? (
                  <label
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                      dragging
                        ? "border-indigo bg-indigo-soft/50"
                        : "border-ink-300/50 hover:border-indigo/50"
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
                    <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-indigo shadow-1">
                      <UploadCloud size={22} className="text-white" />
                    </div>
                    <span className="text-sm text-ink-700">
                      Drag &amp; drop their resume, or <span className="font-medium text-indigo-deep">click to choose</span>
                    </span>
                    <span className="text-xs text-ink-400">A clean PDF works best. We support up to 10 MB.</span>
                    <div className="flex items-center gap-2">
                      <span className="eyebrow text-[10px]">PDF only</span>
                      <span className="text-ink-300">·</span>
                      <span className="eyebrow text-[10px]">10 MB max</span>
                      <span className="text-ink-300">·</span>
                      <span className="eyebrow text-[10px]">Single file</span>
                    </div>
                  </label>
                ) : (
                  <>
                    <div className="flex items-center gap-3 rounded-xl border border-ink-200/60 bg-ink-100/50 px-3 py-2">
                      <FileText size={18} className="flex-shrink-0 text-ink-400" />
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
                      className="mt-4 rounded-full bg-indigo-deep px-6 py-2.5 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3 disabled:opacity-50"
                    >
                      Extract &amp; send to review →
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
