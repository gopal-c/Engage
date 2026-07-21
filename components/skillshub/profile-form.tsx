"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HrResumeSection } from "@/components/skillshub/hr-resume-section";
import { MilestonesPanel } from "@/components/skillshub/milestones-panel";
import { maxDateOfBirth } from "@/lib/skillshub/domain";
import type { Profile, Seniority, Proficiency, Status, Skill, Project, Education, Milestone } from "@/lib/skillshub/types";

type Props = {
  profile: Profile;
  /** "review" = HR reviewing a pending profile. "edit" = unused legacy HR edit.
   *  "self" = employee editing their own profile from /me. */
  mode: "review" | "edit" | "self";
  onSaved?: () => void;
  initialMilestones?: Milestone[];
};

const SENIORITIES: Seniority[]   = ["junior", "mid", "senior", "lead"];
const PROFICIENCIES: Proficiency[] = ["beginner", "intermediate", "advanced", "expert"];

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
    <div className="space-y-s-6">
      {/* Basics */}
      <Card>
        <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
        <CardContent className="grid gap-s-4 md:grid-cols-2">
          <div className="space-y-s-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {mode !== "self" && (
            <div className="space-y-s-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          )}
          {(mode === "review" || mode === "self") && (
            <div className="space-y-s-2">
              <Label htmlFor="work-email">Work email</Label>
              <Input
                id="work-email"
                type="email"
                value={workEmail}
                disabled={workEmailLocked}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="name@valueaddsofttech.com"
              />
              {workEmailLocked && (
                <p className="text-[12px] text-fg-2">Verified — contact HR to change this email.</p>
              )}
              {mode === "self" && !workEmailLocked && workEmail && (
                <p className="text-[12px] text-fg-2">Changing this re-sends a verification email.</p>
              )}
            </div>
          )}
          <div className="space-y-s-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="space-y-s-2">
            <Label htmlFor="yrs">Years of experience</Label>
            <Input
              id="yrs"
              type="number"
              min={0}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-s-2">
            <Label htmlFor="seniority">Seniority</Label>
            <Select value={seniority} onValueChange={(v) => setSeniority(v as Seniority)}>
              <SelectTrigger id="seniority"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SENIORITIES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card>
        <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
        <CardContent className="grid gap-s-4 md:grid-cols-2">
          <div className="space-y-s-2">
            <Label htmlFor="joining-date">Joining Date</Label>
            <Input
              id="joining-date"
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </div>
          <div className="space-y-s-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={dateOfBirth}
              max={maxDateOfBirth()}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            <p className="text-[12px] text-fg-2">Must be at least 16 years ago.</p>
          </div>
        </CardContent>
      </Card>

      {/* Resume — HR only; employees use /upload for their own re-uploads */}
      {mode !== "self" && <HrResumeSection profile={profile} />}

      {/* Milestones & Achievements */}
      <MilestonesPanel
        profileId={profile.id}
        initialMilestones={initialMilestones}
      />

      {/* Skills */}
      <Card>
        <CardHeader><CardTitle>Skills ({skills.length})</CardTitle></CardHeader>
        <CardContent className="space-y-s-3">
          {skills.length === 0 && (
            <p className="text-[13px] text-fg-2">No skills yet. Add one below.</p>
          )}
          {skills.map((s, i) => (
            <div key={i} className="grid grid-cols-1 items-end gap-s-2 sm:grid-cols-[1fr_120px_140px_90px_auto]">
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                aria-label="Remove skill"
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSkills([...skills, { name: "", category: "other", proficiency: "intermediate", yearsExperience: 0 }])}
          >
            + Add skill
          </Button>
        </CardContent>
      </Card>

      {/* Projects */}
      <Card>
        <CardHeader><CardTitle>Projects ({projects.length})</CardTitle></CardHeader>
        <CardContent className="space-y-s-4">
          {projects.length === 0 && (
            <p className="text-[13px] text-fg-2">No projects yet. Add one below.</p>
          )}
          {projects.map((p, i) => (
            <div key={i} className="space-y-s-2 rounded-md border border-border-hairline p-s-3">
              <div className="grid gap-s-2 sm:grid-cols-[1fr_150px_auto]">
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setProjects(projects.filter((_, j) => j !== i))}
                  aria-label="Remove project"
                >
                  ×
                </Button>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setProjects([...projects, { name: "", description: "", skillsUsed: [], duration: "" }])}
          >
            + Add project
          </Button>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader><CardTitle>Education ({education.length})</CardTitle></CardHeader>
        <CardContent className="space-y-s-3">
          {education.length === 0 && (
            <p className="text-[13px] text-fg-2">No education entries yet.</p>
          )}
          {education.map((e, i) => (
            <div key={i} className="grid items-end gap-s-2 sm:grid-cols-[1fr_1fr_110px_100px_auto]">
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEducation(education.filter((_, j) => j !== i))}
                aria-label="Remove education"
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEducation([...education, { degree: "", institution: "", year: new Date().getFullYear() }])}
          >
            + Add education
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-end gap-s-3 border-t border-border-hairline pt-s-5">
        {mode === "review" ? (
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => submit({ status: "rejected" }, "Profile rejected.", "/apps/skillshub/review")}
            >
              Reject
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => submit(buildPatch(), "Changes saved.")}
            >
              {isPending ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={() => submit({ status: "approved" }, "Profile approved.", "/apps/skillshub/review")}
            >
              Approve
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => submit(buildPatch({ status: "approved" }), "Saved & approved.", "/apps/skillshub/review")}
            >
              Save &amp; approve
            </Button>
          </>
        ) : mode === "self" ? (
          <>
            <Button type="button" variant="ghost" onClick={() => onSaved?.()}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => submit(buildPatch(), "Changes saved.")}
            >
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/apps/skillshub/employees/${profile.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => submit(buildPatch(), "Changes saved.", `/apps/skillshub/employees/${profile.id}`)}
            >
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
