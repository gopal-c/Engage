"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

const HOBBIES = ["Reading", "Gaming", "Cooking", "Traveling", "Photography", "Music", "Sports", "Gardening", "Art", "Movies", "Fitness", "Dancing"];
const DRINKS = ["Tea", "Coffee", "Juice", "Smoothie", "Soda", "Hot Chocolate", "Lassi", "Milkshake"];
const FOOD_OPTIONS = ["Vegetarian", "Non-Vegetarian", "Vegan", "Eggetarian"];
const INTERESTS = ["Technology", "Finance", "Design", "Health & Wellness", "Sustainability", "Entrepreneurship", "Education", "Social Impact"];
const CELEBRATION_STYLES = ["Love surprises", "Keep it simple", "Cake & party", "Just wishes are fine"];

type AboutMeData = {
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
  const [originalDob, setOriginalDob] = useState("");

  const [aboutMe, setAboutMe] = useState<AboutMeData>({
    hobbies: [], favorite_drinks: [], food_preference: null,
    interests: [], celebration_style: null, about_me: null,
  });
  const [originalAboutMe, setOriginalAboutMe] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/birthdayhub/about-me").then((r) => r.json()),
    ])
      .then(([profileData, aboutMeData]) => {
        const d = profileData.user?.date_of_birth || "";
        setDob(d);
        setOriginalDob(d);

        if (aboutMeData.aboutMe) {
          const a: AboutMeData = {
            hobbies: aboutMeData.aboutMe.hobbies ?? [],
            favorite_drinks: aboutMeData.aboutMe.favorite_drinks ?? [],
            food_preference: aboutMeData.aboutMe.food_preference ?? null,
            interests: aboutMeData.aboutMe.interests ?? [],
            celebration_style: aboutMeData.aboutMe.celebration_style ?? null,
            about_me: aboutMeData.aboutMe.about_me ?? null,
          };
          setAboutMe(a);
          setOriginalAboutMe(JSON.stringify(a));
        } else {
          setOriginalAboutMe(JSON.stringify(aboutMe));
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasDobChange = dob !== originalDob;
  const hasAboutMeChange = JSON.stringify(aboutMe) !== originalAboutMe;
  const hasChanges = hasDobChange || hasAboutMeChange;

  const maxDob = new Date(
    new Date().getFullYear() - 16,
    new Date().getMonth(),
    new Date().getDate(),
  ).toISOString().slice(0, 10);

  async function handleSave() {
    setSaving(true);

    try {
      const promises: Promise<Response>[] = [];

      if (hasDobChange) {
        promises.push(
          fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date_of_birth: dob || null }),
          })
        );
      }

      if (hasAboutMeChange) {
        promises.push(
          fetch("/api/birthdayhub/about-me", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(aboutMe),
          })
        );
      }

      const results = await Promise.all(promises);
      const allOk = results.every((r) => r.ok);

      if (allOk) {
        setOriginalDob(dob);
        setOriginalAboutMe(JSON.stringify(aboutMe));
        toast.success("Profile updated!");
      } else {
        toast.error("Failed to save some changes");
      }
    } catch {
      toast.error("Failed to save changes");
    }

    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">About Me</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Help us personalize your birthday wishes — all optional
          </p>
        </div>

        {/* DOB */}
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

        {/* Hobbies */}
        <ChipSection
          label="Hobbies"
          options={HOBBIES}
          selected={aboutMe.hobbies}
          onToggle={(item) => setAboutMe((p) => ({ ...p, hobbies: toggleItem(p.hobbies, item) }))}
        />

        {/* Favorite Drinks */}
        <ChipSection
          label="Favorite Drinks"
          options={DRINKS}
          selected={aboutMe.favorite_drinks}
          onToggle={(item) => setAboutMe((p) => ({ ...p, favorite_drinks: toggleItem(p.favorite_drinks, item) }))}
        />

        {/* Food Preference */}
        <RadioChipSection
          label="Food Preference"
          options={FOOD_OPTIONS}
          selected={aboutMe.food_preference}
          onSelect={(val) => setAboutMe((p) => ({ ...p, food_preference: p.food_preference === val ? null : val }))}
        />

        {/* Interests */}
        <ChipSection
          label="Interests"
          options={INTERESTS}
          selected={aboutMe.interests}
          onToggle={(item) => setAboutMe((p) => ({ ...p, interests: toggleItem(p.interests, item) }))}
        />

        {/* Celebration Style */}
        <RadioChipSection
          label="Celebration Style"
          options={CELEBRATION_STYLES}
          selected={aboutMe.celebration_style}
          onSelect={(val) => setAboutMe((p) => ({ ...p, celebration_style: p.celebration_style === val ? null : val }))}
        />

        {/* About Me text */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Anything else?</label>
          <textarea
            rows={3}
            maxLength={500}
            placeholder="Anything else you'd like us to know?"
            value={aboutMe.about_me ?? ""}
            onChange={(e) => setAboutMe((p) => ({ ...p, about_me: e.target.value || null }))}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-right text-xs text-muted-foreground">
            {(aboutMe.about_me ?? "").length}/500
          </p>
        </div>
      </div>

      {/* Save */}
      <div>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="rounded-lg bg-indigo-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-press disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
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
