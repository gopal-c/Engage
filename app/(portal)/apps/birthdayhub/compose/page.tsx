"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string | null;
  birthday: string;
  notes: string | null;
}

const illustrations = [
  "birthday-1.png", "birthday-2.png", "birthday-3.png",
  "birthday-4.png", "birthday-5.png", "birthday-6.png",
];

export default function ComposePage() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("employee");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState(preselectedId || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedImage, setSelectedImage] = useState(illustrations[0]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"select" | "preview">("select");

  useEffect(() => {
    fetch("/api/birthdayhub/employees")
      .then((res) => res.json())
      .then((data) => {
        setEmployees(data.employees ?? []);
        if (preselectedId) {
          setSelectedId(preselectedId);
        }
      });
  }, [preselectedId]);

  const selected = employees.find((e) => e.id === selectedId);

  async function handleGenerate() {
    if (!selected) return;
    setGenerating(true);
    setMessage("");

    const res = await fetch("/api/birthdayhub/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: selected.name,
        department: selected.department,
        notes: selected.notes,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const lines = data.message.split("\n");
      const subjectLine = lines.find((l: string) => l.startsWith("Subject:"));
      setSubject(subjectLine ? subjectLine.replace("Subject:", "").trim() : `Happy Birthday, ${selected.name}!`);
      setBody(lines.filter((l: string) => !l.startsWith("Subject:")).join("\n").trim());
      setSelectedImage(illustrations[Math.floor(Math.random() * illustrations.length)]);
      setStep("preview");
    } else {
      const data = await res.json();
      setMessage(data.error || "Generation failed");
    }
    setGenerating(false);
  }

  async function handleSend() {
    if (!selected) return;
    setSending(true);
    setMessage("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <img src="${window.location.origin}/birthday/${selectedImage}"
             alt="Happy Birthday" style="width:100%;max-width:400px;border-radius:12px;margin-bottom:20px;" />
        <div style="white-space:pre-wrap;line-height:1.6;font-size:15px;">${body}</div>
        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
        <p style="font-size:12px;color:#888;">Sent with love from ValueAdd SoftTech via BirthdayHub</p>
      </div>
    `;

    const res = await fetch("/api/birthdayhub/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: selected.id, subject, html }),
    });

    if (res.ok) {
      setMessage("Email sent successfully!");
      setStep("select");
      setSelectedId("");
      setSubject("");
      setBody("");
    } else {
      const data = await res.json();
      setMessage(data.error || "Send failed");
    }
    setSending(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/apps/birthdayhub" className="text-muted-foreground hover:text-foreground">
          BirthdayHub
        </Link>
        <span className="text-muted-foreground">/</span>
        <h2 className="text-2xl font-semibold">Compose Birthday Email</h2>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message}
        </p>
      )}

      {step === "select" && (
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Select Employee</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Choose an employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.email} ({emp.birthday})
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p><strong>{selected.name}</strong> ({selected.email})</p>
              {selected.department && <p className="text-muted-foreground">Department: {selected.department}</p>}
              {selected.notes && <p className="text-muted-foreground">Notes: {selected.notes}</p>}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedId || generating}
          >
            {generating ? "Generating with AI..." : "Generate Birthday Message"}
          </Button>
        </div>
      )}

      {step === "preview" && selected && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              To: {selected.name} &lt;{selected.email}&gt;
            </p>

            <div>
              <label className="text-sm font-medium">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Illustration</label>
              <div className="mt-1.5 flex gap-2 overflow-x-auto pb-2">
                {illustrations.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`shrink-0 rounded-lg border-2 p-1 ${
                      selectedImage === img ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img
                      src={`/birthday/${img}`}
                      alt={img}
                      className="h-16 w-16 rounded object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSend} disabled={sending}>
                {sending ? "Sending..." : "Send Email"}
              </Button>
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                Regenerate
              </Button>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
