"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { HrResumeSection } from "@/components/skillshub/hr-resume-section";
import { MilestonesPanel } from "@/components/skillshub/milestones-panel";
import { maxDateOfBirth } from "@/lib/skillshub/domain";
import type { Profile, Seniority, Proficiency, Status, Skill, Project, Education, Milestone } from "@/lib/skillshub/types";

type Props = {
  profile: Profile;
  mode: "review" | "edit" | "self";
  onSaved?: () => void;
  initialMilestones?: Milestone[];
};

const SENIORITIES: Seniority[]   = ["junior", "mid", "senior", "lead"];
const PROFICIENCIES: Proficiency[] = ["beginner", "intermediate", "advanced", "expert"];

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-surface rounded-2xl border border-white/70 p-6 shadow-2">
      <h3 className="mb-5 text-ink-800">{title}</h3>
      {children}
    </section>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-ink-500">
      {children}
    </label>
  );
}

export function ProfileForm({ profile, mode, onSaved, initialMilestones = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName]                       = useState(profile.name);
  const [email, setEmail]                     = useState(profile.email);
  const [city, setCity]                       = useState(profile.city);
  const [seniority, setSeniority]             = useState<Seniority>(profile.seniority);
  const [yearsExperience, setYearsExperience] = useState<number>(profile.yearsExperience);
  const [skills, setSkills]                   = useState<Skill[]>(profile.skills);
  const [projects, setProjects]               = useState<Project[]>(profile.projects);
  const [education, setEducation]             = useState<Education[]>(profile.education);
  const [workEmail, setWorkEmail]             = useState(profile.workEmail ?? "");
  const [joiningDate, setJoiningDate]         = useState(profile.joiningDate ?? "");
  const [dateOfBirth, setDateOfBirth]         = useState(profile.dateOfBirth ?? "");

  const workEmailLocked = mode === "self" && profile.workEmailVerified;

  function buildPatch(extra: Partial<{ status: Status }> = {}) {
    const patch: Record<string, unknown> = {
      name, city, seniority, yearsExperience,
      skills, projects, education,
      joiningDate: joiningDate || null,
      dateOfBirth: dateOfBirth || null,
      ...extra,
    };
    if (mode !== "self") patch.email = email;
    if (mode === "self" || mode === "review") patch.workEmail = workEmail;
    return patch;
  }

  function submit(patch: Record<string, unknown>, successMessage: string, target?: string) {
    const url = mode === "self" ? "/api/skillshub/me/profile" : `/api/skillshub/profiles/${profile.id}`;
    startTransition(async () => {
      try {
        const res = await fetch(url, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (!data.ok) {
          toast.error(data.error ?? "Couldn't save.");
          return;
        }
        toast.success(data.verificationSent === false && patch.workEmail
          ? `${successMessage} Couldn't send a verification email — try again from your profile.`
          : data.verificationSent
            ? `${successMessage} We sent a new verification link to ${patch.workEmail}.`
            : successMessage);
        if (target) router.push(target);
        onSaved?.();
        router.refresh();
      } catch {
        toast.error("Network error — try again.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="display-xl">{profile.name}</h1>
          <p className="mt-1 text-sm text-ink-500">{profile.email}</p>
        </div>
        <span className={`eyebrow text-xs ${
          profile.status === "pending" ? "text-coral-deep" : "text-teal-deep"
        }`}>
          {profile.status}
        </span>
      </div>

      {/* Basics */}
      <SectionCard title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {mode !== "self" && (
            <div>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}
          {(mode === "review" || mode === "self") && (
            <div>
              <FieldLabel htmlFor="work-email">Work email</FieldLabel>
              <Input
                id="work-email"
                type="email"
                value={workEmail}
                disabled={workEmailLocked}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="name@valueaddsofttech.com"
              />
              {workEmailLocked && (
                <p className="mt-1 text-[11px] text-ink-400">Verified — contact HR to change this email.</p>
              )}
              {mode === "self" && !workEmailLocked && workEmail && (
                <p className="mt-1 text-[11px] text-ink-400">Changing this re-sends a verification email.</p>
              )}
            </div>
          )}
          <div>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="yrs">Years of experience</FieldLabel>
            <Input
              id="yrs"
              type="number"
              min={0}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="seniority">Seniority</FieldLabel>
            <Select value={seniority} onValueChange={(v) => setSeniority(v as Seniority)}>
              <SelectTrigger id="seniority"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SENIORITIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Employment Details */}
      <SectionCard title="Employment Details">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel htmlFor="joining-date">Joining Date</FieldLabel>
            <Input
              id="joining-date"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </div>
          <div>
            <FieldLabel htmlFor="dob">Date of Birth</FieldLabel>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              max={maxDateOfBirth()}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-ink-400">Must be at least 16 years ago.</p>
          </div>
        </div>
      </SectionCard>

      {/* Resume — HR only */}
      {mode !== "self" && <HrResumeSection profile={profile} />}

      {/* Milestones & Achievements */}
      <MilestonesPanel
        profileId={profile.id}
        initialMilestones={initialMilestones}
      />

      {/* Skills */}
      <SectionCard title={`Skills (${skills.length})`}>
        {skills.length === 0 && (
          <p className="mb-3 text-sm text-ink-400">No skills yet. Add one below.</p>
        )}
        <div className="space-y-2">
          {skills.map((s, i) => (
            <div key={i} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_120px_140px_80px_auto]">
              <Input
                placeholder="Skill name"
                value={s.name}
                onChange={(e) => {
                  const next = [...skills]; next[i] = { ...next[i], name: e.target.value }; setSkills(next);
                }}
              />
              <Input
                placeholder="Category"
                value={s.category}
                onChange={(e) => {
                  const next = [...skills]; next[i] = { ...next[i], category: e.target.value }; setSkills(next);
                }}
              />
              <Select
                value={s.proficiency}
                onValueChange={(v) => {
                  const next = [...skills]; next[i] = { ...next[i], proficiency: v as Proficiency }; setSkills(next);
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROFICIENCIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0}
                placeholder="yrs"
                value={s.yearsExperience}
                onChange={(e) => {
                  const next = [...skills]; next[i] = { ...next[i], yearsExperience: Number(e.target.value) || 0 }; setSkills(next);
                }}
              />
              <button
                type="button"
                onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                aria-label="Remove skill"
                className="flex size-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSkills([...skills, { name: "", category: "other", proficiency: "intermediate", yearsExperience: 0 }])}
          className="mt-3 text-sm font-medium text-ink-600 hover:text-ink-800"
        >
          + Add skill
        </button>
      </SectionCard>

      {/* Projects */}
      <SectionCard title={`Projects (${projects.length})`}>
        {projects.length === 0 && (
          <p className="mb-3 text-sm text-ink-400">No projects yet. Add one below.</p>
        )}
        <div className="space-y-4">
          {projects.map((p, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-ink-200/60 p-4">
              <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                <Input
                  placeholder="Project name"
                  value={p.name}
                  onChange={(e) => {
                    const next = [...projects]; next[i] = { ...next[i], name: e.target.value }; setProjects(next);
                  }}
                />
                <Input
                  placeholder="Duration"
                  value={p.duration}
                  onChange={(e) => {
                    const next = [...projects]; next[i] = { ...next[i], duration: e.target.value }; setProjects(next);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setProjects(projects.filter((_, j) => j !== i))}
                  aria-label="Remove project"
                  className="flex size-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
                >
                  ×
                </button>
              </div>
              <Textarea
                placeholder="Description"
                rows={3}
                value={p.description}
                onChange={(e) => {
                  const next = [...projects]; next[i] = { ...next[i], description: e.target.value }; setProjects(next);
                }}
              />
              <Input
                placeholder="Skills used, comma-separated"
                value={p.skillsUsed.join(", ")}
                onChange={(e) => {
                  const next = [...projects];
                  next[i] = { ...next[i], skillsUsed: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) };
                  setProjects(next);
                }}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setProjects([...projects, { name: "", description: "", skillsUsed: [], duration: "" }])}
          className="mt-3 text-sm font-medium text-ink-600 hover:text-ink-800"
        >
          + Add project
        </button>
      </SectionCard>

      {/* Education */}
      <SectionCard title={`Education (${education.length})`}>
        {education.length === 0 && (
          <p className="mb-3 text-sm text-ink-400">No education entries yet.</p>
        )}
        <div className="space-y-2">
          {education.map((e, i) => (
            <div key={i} className="grid items-center gap-2 sm:grid-cols-[1fr_1fr_100px_90px_auto]">
              <Input
                placeholder="Degree"
                value={e.degree}
                onChange={(ev) => {
                  const next = [...education]; next[i] = { ...next[i], degree: ev.target.value }; setEducation(next);
                }}
              />
              <Input
                placeholder="Institution"
                value={e.institution}
                onChange={(ev) => {
                  const next = [...education]; next[i] = { ...next[i], institution: ev.target.value }; setEducation(next);
                }}
              />
              <select
                aria-label="Month"
                value={e.month ?? ""}
                onChange={(ev) => {
                  const next = [...education];
                  const v = ev.target.value;
                  next[i] = { ...next[i], month: v ? Number(v) : undefined };
                  setEducation(next);
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-[13px] text-foreground"
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, m) => (
                  <option key={m + 1} value={m + 1}>
                    {new Date(2000, m).toLocaleString("en-US", { month: "short" })}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                placeholder="Year"
                value={e.year}
                onChange={(ev) => {
                  const next = [...education]; next[i] = { ...next[i], year: Number(ev.target.value) || 0 }; setEducation(next);
                }}
              />
              <button
                type="button"
                onClick={() => setEducation(education.filter((_, j) => j !== i))}
                aria-label="Remove education"
                className="flex size-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setEducation([...education, { degree: "", institution: "", year: new Date().getFullYear() }])}
          className="mt-3 text-sm font-medium text-ink-600 hover:text-ink-800"
        >
          + Add education
        </button>
      </SectionCard>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-5" style={{ borderTop: "var(--t-bar-border)" }}>
        {mode === "review" ? (
          <>
            <button
              type="button"
              onClick={() => router.push("/apps/skillshub/review")}
              className="mr-auto px-4 py-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800"
            >
              Cancel
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800 disabled:opacity-50"
                >
                  Reject
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject this profile?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reject {profile.name}&apos;s profile. They will need to resubmit for review.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => submit({ status: "rejected" }, "Profile rejected.", "/apps/skillshub/review")}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reject
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(buildPatch(), "Changes saved.")}
              className="rounded-xl border border-ink-200 bg-ink-0 px-4 py-2 text-sm font-medium text-ink-700 shadow-1 transition-all hover:shadow-2 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(buildPatch({ status: "approved" }), "Saved & approved.", "/apps/skillshub/review")}
              className="rounded-xl bg-indigo-deep px-5 py-2 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3 disabled:opacity-50"
            >
              Save &amp; approve
            </button>
          </>
        ) : mode === "self" ? (
          <>
            <button
              type="button"
              onClick={() => onSaved?.()}
              className="px-4 py-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(buildPatch(), "Changes saved.")}
              className="rounded-xl bg-indigo-deep px-5 py-2 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => router.push(`/apps/skillshub/employees/${profile.id}`)}
              className="px-4 py-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => submit(buildPatch(), "Changes saved.", `/apps/skillshub/employees/${profile.id}`)}
              className="rounded-xl bg-indigo-deep px-5 py-2 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
