"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  onClose: () => void;
  onImported: (count: number) => void;
}

/* ------------------------------------------------------------------ */
/*  ImportModal                                                        */
/* ------------------------------------------------------------------ */

export default function ImportModal({ onClose, onImported }: Props) {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [csvText, setCsvText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function readFileAsText(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(f);
    });
  }

  async function handleImport() {
    setImporting(true);
    setError("");
    setResult(null);

    try {
      let text = csvText;
      if (mode === "upload" && file) {
        text = await readFileAsText(file);
      }
      if (!text.trim()) {
        setError("No CSV data provided");
        setImporting(false);
        return;
      }

      /* Parse with PapaParse */
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase(),
      });

      const rows = (parsed.data as Record<string, string>[]).map((row) => ({
        name: row.name?.trim() ?? "",
        email: row.email?.trim() ?? "",
        department: row.department?.trim() ?? "",
        birthday: row.birthday?.trim() ?? "",
        notes: row.notes?.trim() ?? "",
      }));

      if (rows.length === 0) {
        setError("No valid rows found in CSV");
        setImporting(false);
        return;
      }

      /* POST to import endpoint */
      const res = await fetch("/api/birthdayhub/employees/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      setResult({
        imported: data.imported ?? 0,
        skipped: data.skipped ?? 0,
        errors: data.errors ?? [],
      });

      if (data.imported > 0) {
        onImported(data.imported);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function handleTryAgain() {
    setResult(null);
    setError("");
    setCsvText("");
    setFile(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Import Employees</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Result state */}
          {result ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <p className="text-sm font-medium text-green-700">
                  Imported {result.imported} employee{result.imported !== 1 ? "s" : ""}
                </p>
                {result.skipped > 0 && (
                  <p className="mt-1 text-xs text-green-600">
                    {result.skipped} skipped (duplicates or invalid)
                  </p>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-medium text-red-700 mb-1">Errors:</p>
                  <ul className="text-xs text-red-600 space-y-0.5">
                    {result.errors.slice(0, 10).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>...and {result.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
                  style={{ backgroundColor: "#2D1B69" }}
                >
                  Done
                </button>
                <button
                  onClick={handleTryAgain}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Import More
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMode("upload")}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    mode === "upload"
                      ? "text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                  style={mode === "upload" ? { backgroundColor: "#2D1B69" } : {}}
                >
                  Upload CSV File
                </button>
                <button
                  type="button"
                  onClick={() => setMode("paste")}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    mode === "paste"
                      ? "text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                  style={mode === "paste" ? { backgroundColor: "#2D1B69" } : {}}
                >
                  Paste CSV Text
                </button>
              </div>

              {/* Upload mode */}
              {mode === "upload" && (
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 text-center hover:border-gray-300 transition"
                  >
                    {file ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-1">Click to change file</p>
                      </div>
                    ) : (
                      <div>
                        <svg
                          className="mx-auto h-8 w-8 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-gray-500">
                          Click to select a CSV file
                        </p>
                      </div>
                    )}
                  </button>
                </div>
              )}

              {/* Paste mode */}
              {mode === "paste" && (
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={8}
                  placeholder={`name,email,department,birthday,notes\nJohn Doe,john@company.com,Engineering,03-15,Loves cake`}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-mono focus:border-[#2D1B69] focus:ring-1 focus:ring-[#2D1B69] outline-none transition resize-y"
                />
              )}

              {/* Accepted formats */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Accepted birthday formats:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["MM-DD", "YYYY-MM-DD", "MM/DD", "Month DD", "DD Month"].map(
                    (fmt) => (
                      <span
                        key={fmt}
                        className="rounded bg-white border border-gray-200 px-2 py-0.5 text-xs font-mono text-gray-500"
                      >
                        {fmt}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                  <button
                    onClick={handleTryAgain}
                    className="ml-2 underline text-red-600 hover:text-red-800"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={
                    importing ||
                    (mode === "upload" ? !file : !csvText.trim())
                  }
                  className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
                  style={{ backgroundColor: "#2D1B69" }}
                >
                  {importing ? "Importing..." : "Import"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
