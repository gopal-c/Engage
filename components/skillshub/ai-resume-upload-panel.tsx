"use client";

import { useRef, useState } from "react";
import { Sparkles, FileText, CheckCircle2, UploadCloud, X } from "lucide-react";

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB — mirrors lib/extract.ts

type Props = {
  existingResume?: { updatedAt: Date | string } | null;
  /**
   * Should not throw — handle failures internally (e.g. toast) and just
   * leave `isSuccess` false so the panel falls back to the file-selected
   * state for a retry, instead of losing the picked file.
   */
  onUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  isSuccess: boolean;
  /** Called when the user dismisses the success state via "Replace resume". */
  onReset?: () => void;
};

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Elevated "AI is doing something here" panel for resume extraction —
 * shared between the HR review/edit form and /onboard. Purely presentational
 * state machine: empty → selected → loading → success, plus a persistent
 * "resume on file" row when one already exists.
 */
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
    <div className="ai-resume-panel">
      {/* Header */}
      <div className="ai-header">
        <div className="ai-title">
          <Sparkles size={16} />
          <span>AI Resume Extraction</span>
        </div>
        <span className="ai-badge">Powered by Groq</span>
      </div>

      <p className="ai-desc">
        Upload a PDF — Groq will read it and fill in this employee&rsquo;s skills, experience, and
        profile automatically.
      </p>

      {/* Success */}
      {isSuccess ? (
        <div className="ai-success">
          <CheckCircle2 size={28} />
          <span className="ai-success-text">Profile updated from resume</span>
          <button type="button" className="ai-replace-link" onClick={replaceResume}>
            Replace resume
          </button>
        </div>
      ) : isLoading ? (
        /* Loading — pulse the inner content only; the panel + accent bar stay put. */
        <div className="ai-loading">
          <div className="animate-pulse flex flex-col items-center gap-s-2">
            <Sparkles size={24} style={{ color: "var(--brand-indigo-deep)" }} />
            <span className="ai-loading-text">Extracting profile with Groq&hellip;</span>
          </div>
        </div>
      ) : (
        <>
          {/* Resume-on-file indicator */}
          {existingResume && !showDropzone && (
            <div className="ai-on-file">
              <FileText size={16} />
              <span>Resume on file &middot; last updated {formatDate(existingResume.updatedAt)}</span>
              <button type="button" className="ai-replace-link" onClick={() => setShowDropzone(true)}>
                Replace
              </button>
            </div>
          )}

          {(!existingResume || showDropzone) && (
            <>
              {!file ? (
                <label
                  className={`ai-dropzone ${dragging ? "dragging" : ""}`}
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
                  />
                  <UploadCloud size={28} className="ai-dz-icon" />
                  <span className="ai-dz-text">
                    Drop resume here or <b>click to browse</b>
                  </span>
                  <span className="ai-dz-hint">PDF only &middot; up to 10 MB</span>
                </label>
              ) : (
                <>
                  <div className="ai-file-row">
                    <span className="ai-file-icon">
                      <FileText size={18} />
                    </span>
                    <div>
                      <div className="ai-file-name">{file.name}</div>
                      <div className="ai-file-meta">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                    </div>
                    <button type="button" className="ai-file-clear" onClick={clearFile} aria-label="Remove file">
                      <X size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="ai-submit-btn"
                    onClick={() => onUpload(file)}
                    disabled={isLoading}
                  >
                    Extract &amp; Save Profile
                  </button>
                </>
              )}
              {pickError && (
                <p className="mt-s-2 text-[12px]" style={{ color: "var(--brand-coral-press)" }}>
                  {pickError}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
