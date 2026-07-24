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
    <section className="glass-surface overflow-hidden rounded-2xl border border-white/70 shadow-2">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-ink-200/40 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo to-indigo-deep shadow-1">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink-800">AI Resume Extraction</h3>
            <p className="text-[11px] text-ink-400">Upload a PDF — AI extracts skills, experience &amp; profile</p>
          </div>
        </div>
        <span className="eyebrow text-[10px] text-indigo-deep">Powered by Groq</span>
      </div>

      <div className="p-6">
        {/* Success */}
        {isSuccess ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <div className="flex size-12 items-center justify-center rounded-full bg-teal/10">
              <CheckCircle2 size={24} className="text-teal-deep" />
            </div>
            <span className="text-sm font-medium text-ink-800">Profile updated from resume</span>
            <button type="button" onClick={replaceResume} className="mt-1 text-xs font-medium text-indigo-deep hover:underline">
              Upload another
            </button>
          </div>
        ) : isLoading ? (
          <div className="py-8">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-indigo-soft">
                <Sparkles size={20} className="animate-pulse text-indigo-deep" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-ink-700">Extracting profile&hellip;</p>
                <p className="mt-0.5 text-xs text-ink-400">This usually takes 10-20 seconds</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Resume-on-file indicator */}
            {existingResume && !showDropzone && (
              <div className="flex items-center gap-3 rounded-xl border border-ink-200/60 bg-ink-50/50 px-4 py-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-teal/10">
                  <FileText size={14} className="text-teal-deep" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-ink-700">Resume on file</p>
                  <p className="text-[11px] text-ink-400">Last updated {formatDate(existingResume.updatedAt)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDropzone(true)}
                  className="rounded-lg border border-ink-200/60 px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-ink-100"
                >
                  Replace
                </button>
              </div>
            )}

            {(!existingResume || showDropzone) && (
              <div>
                {!file ? (
                  <label
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                      dragging
                        ? "border-indigo bg-indigo-soft/30"
                        : "border-ink-200/70 hover:border-indigo/40 hover:bg-ink-50/30"
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
                    <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal to-indigo shadow-1">
                      <UploadCloud size={18} className="text-white" />
                    </div>
                    <div>
                      <span className="text-sm text-ink-600">
                        Drag &amp; drop a resume, or <span className="font-medium text-indigo-deep">browse</span>
                      </span>
                      <p className="mt-1 text-[11px] text-ink-400">PDF only &middot; 10 MB max</p>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border border-ink-200/60 bg-ink-50/50 px-4 py-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-soft">
                        <FileText size={14} className="text-indigo-deep" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink-800">{file.name}</p>
                        <p className="text-[11px] text-ink-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        aria-label="Remove file"
                        className="flex size-7 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpload(file)}
                      disabled={isLoading}
                      className="rounded-xl bg-indigo-deep px-5 py-2 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3 disabled:opacity-50"
                    >
                      Extract profile
                    </button>
                  </div>
                )}
                {pickError && (
                  <p className="mt-2 text-xs text-coral-deep">{pickError}</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
