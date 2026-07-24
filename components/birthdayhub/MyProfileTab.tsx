"use client";

import { useState, useEffect } from "react";

export default function MyProfileTab() {
  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");
  const [originalDob, setOriginalDob] = useState("");
  const [originalBio, setOriginalBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        const d = data.user?.date_of_birth || "";
        const b = data.user?.bio || "";
        setDob(d);
        setBio(b);
        setOriginalDob(d);
        setOriginalBio(b);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasChanges = dob !== originalDob || bio !== originalBio;

  const maxDob = new Date(
    new Date().getFullYear() - 16,
    new Date().getMonth(),
    new Date().getDate(),
  )
    .toISOString()
    .slice(0, 10);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date_of_birth: dob || null,
        bio: bio.trim() || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const d = data.user?.date_of_birth || "";
      const b = data.user?.bio || "";
      setDob(d);
      setBio(b);
      setOriginalDob(d);
      setOriginalBio(b);
      setMessage({ text: "Profile updated!", ok: true });
    } else {
      setMessage({ text: "Failed to save changes", ok: false });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
        <h3 className="text-base font-semibold text-foreground">My Birthday Profile</h3>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            max={maxDob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            This helps us know when to celebrate your special day 🎂
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            About Me
          </label>
          <textarea
            rows={4}
            maxLength={500}
            placeholder="Tell us a few lines about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              We&apos;ll use this to personalize your birthday wishes
            </p>
            <span className="text-xs text-muted-foreground">{bio.length}/500</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: "#2D1B69" }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {message && (
            <span className={`text-sm ${message.ok ? "text-green-600" : "text-red-500"}`}>
              {message.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
