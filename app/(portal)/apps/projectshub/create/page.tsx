"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("planning");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
    }
    setSkillInput("");
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/projectshub/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          department: department.trim() || undefined,
          status,
          requiredSkills: skills,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        toast.success("Project created!");
        router.push(`/apps/projectshub/${data.projectId}`);
      } else {
        toast.error(data.error || "Failed to create project");
      }
    } catch {
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/apps/projectshub" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-5 transition">
        <ArrowLeft className="size-4" /> Back to projects
      </Link>

      <div className="bg-white p-6" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <h1 className="text-xl font-bold text-ink-800 mb-5">Create New Project</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Project Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Feedback Portal"
              className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition resize-none"
            />
          </div>

          {/* Required Skills — prominent position for AI matching */}
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-indigo-400 via-purple-400 to-teal-400">
            <div className="rounded-2xl bg-white p-4">
              <label className="flex items-center gap-1.5 text-sm font-medium text-ink-700 mb-2">
                <Sparkles className="size-3.5 text-purple-500" />
                Required Skills
                <span className="text-xs font-normal text-ink-400 ml-1">Used for AI skill matching</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="rounded-xl bg-indigo-deep px-4 py-2.5 text-sm text-white hover:bg-indigo-press transition flex items-center gap-1"
                >
                  <Plus className="size-4" /> Add
                </button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-deep border border-indigo-100/60">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Engineering"
                className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="w-full rounded-xl bg-indigo-deep py-3 text-sm font-medium text-white hover:bg-indigo-press transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {submitting ? "Creating..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
