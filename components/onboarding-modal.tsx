"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const HOBBIES = ["Reading", "Gaming", "Cooking", "Traveling", "Photography", "Music", "Sports", "Gardening", "Art", "Movies", "Fitness", "Dancing"];
const DRINKS = ["Tea", "Coffee", "Juice", "Smoothie", "Soda", "Hot Chocolate", "Lassi", "Milkshake"];
const FOOD_OPTIONS = ["Vegetarian", "Non-Vegetarian", "Vegan", "Eggetarian"];
const INTERESTS = ["Technology", "Finance", "Design", "Health & Wellness", "Sustainability", "Entrepreneurship", "Education", "Social Impact"];
const CELEBRATION_STYLES = ["Love surprises", "Keep it simple", "Cake & party", "Just wishes are fine"];

function toggleItem(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function OnboardingModal({ canSkip = false }: { canSkip?: boolean }) {
  const router = useRouter();
  const [dob, setDob] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [drinks, setDrinks] = useState<string[]>([]);
  const [foodPref, setFoodPref] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [celebrationStyle, setCelebrationStyle] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const maxDob = new Date(
    new Date().getFullYear() - 16,
    new Date().getMonth(),
    new Date().getDate(),
  )
    .toISOString()
    .slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSkip && !dob) return;

    setSaving(true);

    try {
      const res = await fetch("/api/profile/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_of_birth: dob || undefined,
          hobbies,
          favorite_drinks: drinks,
          food_preference: foodPref,
          interests,
          celebration_style: celebrationStyle,
          skip: canSkip && !dob,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Something went wrong");
        return;
      }

      router.refresh();
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/70 bg-white p-8 shadow-xl"
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

          <ChipSection
            label="Hobbies"
            options={HOBBIES}
            selected={hobbies}
            onToggle={(item) => setHobbies((p) => toggleItem(p, item))}
          />

          <ChipSection
            label="Favorite Drinks"
            options={DRINKS}
            selected={drinks}
            onToggle={(item) => setDrinks((p) => toggleItem(p, item))}
          />

          <RadioChipSection
            label="Food Preference"
            options={FOOD_OPTIONS}
            selected={foodPref}
            onSelect={(val) => setFoodPref((p) => p === val ? null : val)}
          />

          <ChipSection
            label="Interests"
            options={INTERESTS}
            selected={interests}
            onToggle={(item) => setInterests((p) => toggleItem(p, item))}
          />

          <RadioChipSection
            label="Celebration Style"
            options={CELEBRATION_STYLES}
            selected={celebrationStyle}
            onSelect={(val) => setCelebrationStyle((p) => p === val ? null : val)}
          />
        </div>

        <Button
          type="submit"
          disabled={saving || (!canSkip && !dob)}
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

function ChipSection({
  label, options, selected, onToggle,
}: {
  label: string; options: string[]; selected: string[]; onToggle: (item: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">{label}</label>
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
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">{label}</label>
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
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700"
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
