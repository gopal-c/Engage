"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function OnboardingModal({ canSkip = false }: { canSkip?: boolean }) {
  const router = useRouter();
  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const maxDob = new Date(
    new Date().getFullYear() - 16,
    new Date().getMonth(),
    new Date().getDate(),
  )
    .toISOString()
    .slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSkip && (!dob || !bio.trim())) return;

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_of_birth: dob || undefined,
          bio: bio.trim() || undefined,
          skip: canSkip && !dob && !bio.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }

      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-8 shadow-xl"
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-ink-800">
            Welcome to Engage!
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Help us get to know you better. This only takes a moment.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label htmlFor="onboard-dob" className="mb-1.5 block text-sm font-medium text-ink-700">
              Date of Birth
            </label>
            <Input
              id="onboard-dob"
              type="date"
              required={!canSkip}
              max={maxDob}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-400">Must be at least 16 years old.</p>
          </div>

          <div>
            <label htmlFor="onboard-bio" className="mb-1.5 block text-sm font-medium text-ink-700">
              About Me
            </label>
            <Textarea
              id="onboard-bio"
              required={!canSkip}
              rows={4}
              maxLength={500}
              placeholder="Tell us a few lines about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <p className="mt-1 text-right text-xs text-ink-400">
              {bio.length}/500
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <Button
          type="submit"
          disabled={saving || (!canSkip && (!dob || !bio.trim()))}
          className="mt-6 w-full rounded-xl bg-indigo-deep text-white hover:bg-indigo-press"
        >
          {saving ? "Saving..." : "Complete Profile"}
        </Button>
        {canSkip && (
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const res = await fetch("/api/profile/onboarding", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ skip: true }),
                });
                if (res.ok) router.refresh();
              } catch { /* */ }
              finally { setSaving(false); }
            }}
            className="mt-2 w-full text-center text-sm text-ink-400 hover:text-ink-600 transition"
          >
            You can fill this in later
          </button>
        )}
      </form>
    </div>
  );
}
