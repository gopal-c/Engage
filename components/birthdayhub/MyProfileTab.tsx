"use client";

import { useState, useEffect } from "react";

const HOBBIES = ["Reading", "Gaming", "Cooking", "Traveling", "Photography", "Music", "Sports", "Gardening", "Art", "Movies", "Fitness", "Dancing"];
const DRINKS = ["Tea", "Coffee", "Juice", "Smoothie", "Soda", "Hot Chocolate", "Lassi", "Milkshake"];
const FOOD_OPTIONS = ["Vegetarian", "Non-Vegetarian", "Vegan", "Eggetarian"];
const INTERESTS = ["Technology", "Finance", "Design", "Health & Wellness", "Sustainability", "Entrepreneurship", "Education", "Social Impact"];
const CELEBRATION_STYLES = ["Love surprises", "Keep it simple", "Cake & party", "Just wishes are fine"];

type Preferences = {
  hobbies: string[];
  favorite_drinks: string[];
  food_preference: string | null;
  interests: string[];
  celebration_style: string | null;
  about_me: string | null;
};

function toggleItem(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export default function MyProfileTab() {
  const [dob, setDob] = useState("");
  const [bio, setBio] = useState("");
  const [originalDob, setOriginalDob] = useState("");
  const [originalBio, setOriginalBio] = useState("");

  const [prefs, setPrefs] = useState<Preferences>({
    hobbies: [], favorite_drinks: [], food_preference: null,
    interests: [], celebration_style: null, about_me: null,
  });
  const [originalPrefs, setOriginalPrefs] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/birthdayhub/preferences").then((r) => r.json()),
    ])
      .then(([profileData, prefsData]) => {
        const d = profileData.user?.date_of_birth || "";
        const b = profileData.user?.bio || "";
        setDob(d);
        setBio(b);
        setOriginalDob(d);
        setOriginalBio(b);

        if (prefsData.preferences) {
          const p: Preferences = {
            hobbies: prefsData.preferences.hobbies ?? [],
            favorite_drinks: prefsData.preferences.favorite_drinks ?? [],
            food_preference: prefsData.preferences.food_preference ?? null,
            interests: prefsData.preferences.interests ?? [],
            celebration_style: prefsData.preferences.celebration_style ?? null,
            about_me: prefsData.preferences.about_me ?? null,
          };
          setPrefs(p);
          setOriginalPrefs(JSON.stringify(p));
        } else {
          setOriginalPrefs(JSON.stringify(prefs));
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasProfileChanges = dob !== originalDob || bio !== originalBio;
  const hasPrefsChanges = JSON.stringify(prefs) !== originalPrefs;
  const hasChanges = hasProfileChanges || hasPrefsChanges;

  const maxDob = new Date(
    new Date().getFullYear() - 16,
    new Date().getMonth(),
    new Date().getDate(),
  ).toISOString().slice(0, 10);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const promises: Promise<Response>[] = [];

      if (hasProfileChanges) {
        promises.push(
          fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date_of_birth: dob || null, bio: bio.trim() || null }),
          })
        );
      }

      if (hasPrefsChanges) {
        promises.push(
          fetch("/api/birthdayhub/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prefs),
          })
        );
      }

      const results = await Promise.all(promises);
      const allOk = results.every((r) => r.ok);

      if (allOk) {
        setOriginalDob(dob);
        setOriginalBio(bio);
        setOriginalPrefs(JSON.stringify(prefs));
        setMessage({ text: "Profile updated!", ok: true });
      } else {
        setMessage({ text: "Failed to save some changes", ok: false });
      }
    } catch {
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
      {/* DOB + Bio card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
        <h3 className="text-base font-semibold text-foreground">My Birthday Profile</h3>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Date of Birth</label>
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
          <label className="block text-sm font-medium text-foreground">Bio</label>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="A short bio about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Shown on your SkillsHub profile</p>
            <span className="text-xs text-muted-foreground">{bio.length}/500</span>
          </div>
        </div>
      </div>

      {/* Preferences card */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Preferences</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Help us personalize your birthday wishes — all optional
          </p>
        </div>

        {/* Hobbies */}
        <ChipSection
          label="Hobbies"
          options={HOBBIES}
          selected={prefs.hobbies}
          onToggle={(item) => setPrefs((p) => ({ ...p, hobbies: toggleItem(p.hobbies, item) }))}
        />

        {/* Favorite Drinks */}
        <ChipSection
          label="Favorite Drinks"
          options={DRINKS}
          selected={prefs.favorite_drinks}
          onToggle={(item) => setPrefs((p) => ({ ...p, favorite_drinks: toggleItem(p.favorite_drinks, item) }))}
        />

        {/* Food Preference */}
        <RadioChipSection
          label="Food Preference"
          options={FOOD_OPTIONS}
          selected={prefs.food_preference}
          onSelect={(val) => setPrefs((p) => ({ ...p, food_preference: p.food_preference === val ? null : val }))}
        />

        {/* Interests */}
        <ChipSection
          label="Interests"
          options={INTERESTS}
          selected={prefs.interests}
          onToggle={(item) => setPrefs((p) => ({ ...p, interests: toggleItem(p.interests, item) }))}
        />

        {/* Celebration Style */}
        <RadioChipSection
          label="Celebration Style"
          options={CELEBRATION_STYLES}
          selected={prefs.celebration_style}
          onSelect={(val) => setPrefs((p) => ({ ...p, celebration_style: p.celebration_style === val ? null : val }))}
        />

        {/* About Me */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">About Me</label>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="Anything else you'd like us to know?"
            value={prefs.about_me ?? ""}
            onChange={(e) => setPrefs((p) => ({ ...p, about_me: e.target.value || null }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-right text-xs text-muted-foreground">
            {(prefs.about_me ?? "").length}/500
          </p>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="rounded-lg bg-indigo-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-press disabled:opacity-50"
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
  );
}

/* ─── Chip Components ─── */

function ChipSection({
  label, options, selected, onToggle,
}: {
  label: string; options: string[]; selected: string[]; onToggle: (item: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "border-indigo-deep bg-indigo-soft text-indigo-deep shadow-sm"
                  : "border-input bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RadioChipSection({
  label, options, selected, onSelect,
}: {
  label: string; options: string[]; selected: string | null; onSelect: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? "border-indigo-deep bg-indigo-soft text-indigo-deep shadow-sm"
                  : "border-input bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
