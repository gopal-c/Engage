"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Users, Target, MessageSquare, Sparkles, Plus, X, Search,
  Calendar, CheckCircle2, Clock, Loader2, Pin, Send, Reply, UserPlus, Trash2, Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Project = {
  id: string; name: string; description: string | null; status: string;
  department: string | null; requiredSkills: string[]; startDate: string | null;
  endDate: string | null; memberCount: number; createdBy: string; createdAt: string;
};
type Member = {
  id: string; userId: string; role: string; userName?: string; userAvatar?: string | null; userEmail?: string;
};
type Milestone = {
  id: string; title: string; description: string | null; targetDate: string | null;
  completedAt: string | null; status: string;
};
type Channel = {
  id: string; name: string; messageCount?: number;
};
type Message = {
  id: string; body: string; userId: string; userName?: string; userAvatar?: string | null;
  parentId: string | null; pinned: boolean; createdAt: string;
  parentMessage?: { body: string; userName: string } | null;
};
type SkillMatch = {
  userId: string; name: string; email: string; avatarUrl: string | null;
  matchedSkills: string[]; matchScore: number; seniority: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-slate-50 text-slate-700 border-slate-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-zinc-50 text-zinc-500 border-zinc-200",
};
const STATUS_LABELS: Record<string, string> = {
  planning: "Planning", active: "Active", on_hold: "On Hold", completed: "Completed", archived: "Archived",
};
const MS_STATUS_ICON: Record<string, typeof CheckCircle2> = {
  completed: CheckCircle2, in_progress: Clock, pending: Clock,
};

const TABS = [
  { key: "overview", label: "Overview", icon: Target },
  { key: "team", label: "Team", icon: Users },
  { key: "skills", label: "Skill Match", icon: Sparkles },
  { key: "channels", label: "Channels", icon: MessageSquare },
] as const;

function Avatar({ name, avatar, size = 32 }: { name?: string; avatar?: string | null; size?: number }) {
  if (avatar) return <img src={avatar} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  const initial = (name ?? "?")[0].toUpperCase();
  return (
    <div className="rounded-full bg-indigo-100 text-indigo-deep flex items-center justify-center font-medium text-xs" style={{ width: size, height: size }}>
      {initial}
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<string>("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);

  // Team tab
  const [skillMatches, setSkillMatches] = useState<SkillMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);

  // Manual add member
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<{ id: string; name: string; email: string; avatar_url: string | null }[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Milestone form
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [msTitle, setMsTitle] = useState("");
  const [msDate, setMsDate] = useState("");
  const [msSubmitting, setMsSubmitting] = useState(false);

  // Channel messaging
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgBody, setMsgBody] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Create channel
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);

  // Rename / delete channel
  const [renameTarget, setRenameTarget] = useState<Channel | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingChannel, setRenamingChannel] = useState(false);
  const [deleteChannelTarget, setDeleteChannelTarget] = useState<Channel | null>(null);
  const [deletingChannel, setDeletingChannel] = useState(false);

  // Remove member confirmation
  const [removeMemberTarget, setRemoveMemberTarget] = useState<Member | null>(null);

  // Edit project
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editSkillInput, setEditSkillInput] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editStatus, setEditStatus] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete project
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projectshub/projects/${id}`);
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
        setMembers(data.members ?? []);
        setMilestones(data.milestones ?? []);
        setChannels(data.channels ?? []);
        if (data.canManage !== undefined) setCanManage(data.canManage);
        if (data.channels?.length > 0 && !activeChannel) {
          setActiveChannel(data.channels[0].id);
        }
      }
    } catch { /* */ }
    setLoading(false);
  }, [id, activeChannel]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const fetchMessages = useCallback(async (channelId: string) => {
    setMsgLoading(true);
    try {
      const res = await fetch(`/api/projectshub/channels/${channelId}/messages`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch { /* */ }
    setMsgLoading(false);
  }, []);

  useEffect(() => {
    if (activeChannel && tab === "channels") fetchMessages(activeChannel);
  }, [activeChannel, tab, fetchMessages]);

  async function runSkillMatch() {
    if (!project?.requiredSkills.length) return;
    setMatchLoading(true);
    try {
      const res = await fetch("/api/projectshub/skill-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredSkills: project.requiredSkills,
          excludeUserIds: members.map((m) => m.userId),
        }),
      });
      const data = await res.json();
      setSkillMatches(data.matches ?? []);
    } catch { /* */ }
    setMatchLoading(false);
  }

  async function addMember(userId: string, role = "member") {
    setAddingMember(userId);
    try {
      const res = await fetch(`/api/projectshub/projects/${id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Member added!");
        fetchProject();
        setSkillMatches((prev) => prev.filter((m) => m.userId !== userId));
      } else {
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("Failed"); }
    setAddingMember(null);
  }

  async function searchUsers(query: string) {
    setMemberSearch(query);
    if (query.trim().length < 2) { setMemberResults([]); return; }
    setMemberSearching(true);
    try {
      const res = await fetch(`/api/projectshub/search-users?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      const existingIds = new Set(members.map((m) => m.userId));
      setMemberResults((data.users ?? []).filter((u: { id: string }) => !existingIds.has(u.id)));
    } catch { setMemberResults([]); }
    setMemberSearching(false);
  }

  async function confirmRemoveMember() {
    if (!removeMemberTarget) return;
    try {
      await fetch(`/api/projectshub/projects/${id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: removeMemberTarget.userId }),
      });
      toast.success("Member removed");
      fetchProject();
    } catch { toast.error("Failed"); }
    setRemoveMemberTarget(null);
  }

  function startEditing() {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditDepartment(project.department ?? "");
    setEditStartDate(project.startDate?.split("T")[0] ?? "");
    setEditEndDate(project.endDate?.split("T")[0] ?? "");
    setEditSkills([...project.requiredSkills]);
    setEditStatus(project.status);
    setEditing(true);
  }

  function addEditSkill() {
    const s = editSkillInput.trim();
    if (s && !editSkills.includes(s)) setEditSkills([...editSkills, s]);
    setEditSkillInput("");
  }

  async function updateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || undefined,
          department: editDepartment.trim() || undefined,
          startDate: editStartDate || undefined,
          endDate: editEndDate || undefined,
          requiredSkills: editSkills,
          status: editStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Project updated!");
        setEditing(false);
        fetchProject();
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch { toast.error("Failed to update project"); }
    setEditSubmitting(false);
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!msTitle.trim()) return;
    setMsSubmitting(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: msTitle.trim(), targetDate: msDate || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Milestone added!");
        setMsTitle("");
        setMsDate("");
        setShowMilestoneForm(false);
        fetchProject();
      }
    } catch { toast.error("Failed"); }
    setMsSubmitting(false);
  }

  async function completeMilestone(ms: Milestone) {
    try {
      await fetch(`/api/projectshub/projects/${id}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: ms.id, title: ms.title, status: "completed" }),
      });
      toast.success("Milestone completed!");
      fetchProject();
    } catch { toast.error("Failed"); }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!msgBody.trim() || !activeChannel) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/projectshub/channels/${activeChannel}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: msgBody.trim(), parentId: replyTo?.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsgBody("");
        setReplyTo(null);
        fetchMessages(activeChannel);
      } else {
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("Failed"); }
    setSendingMsg(false);
  }

  async function handlePin(messageId: string) {
    try {
      await fetch(`/api/projectshub/channels/${activeChannel}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      if (activeChannel) fetchMessages(activeChannel);
    } catch { /* */ }
  }

  async function createNewChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim()) return;
    setCreatingChannel(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${id}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: channelName.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Channel created!");
        setChannelName("");
        setShowChannelForm(false);
        fetchProject();
        setActiveChannel(data.channelId);
      } else {
        toast.error(data.error || "Failed to create channel");
      }
    } catch { toast.error("Failed to create channel"); }
    setCreatingChannel(false);
  }

  async function handleRenameChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    setRenamingChannel(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${id}/channels`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: renameTarget.id, name: renameValue.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Channel renamed!");
        setRenameTarget(null);
        fetchProject();
      } else {
        toast.error(data.error || "Failed to rename");
      }
    } catch { toast.error("Failed to rename channel"); }
    setRenamingChannel(false);
  }

  async function handleDeleteChannel() {
    if (!deleteChannelTarget) return;
    setDeletingChannel(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${id}/channels`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: deleteChannelTarget.id }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Channel deleted");
        if (activeChannel === deleteChannelTarget.id) {
          setActiveChannel(channels.find((ch) => ch.id !== deleteChannelTarget.id)?.id ?? null);
        }
        fetchProject();
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch { toast.error("Failed to delete channel"); }
    setDeletingChannel(false);
    setDeleteChannelTarget(null);
  }

  async function deleteProject() {
    setDeletingProject(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        toast.success("Project deleted");
        router.push("/apps/projectshub");
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete project");
    }
    setDeletingProject(false);
    setShowDeleteConfirm(false);
  }

  if (loading) {
    return (
      <div className="mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-40 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto text-center py-20">
        <p className="text-lg font-semibold text-ink-800">Project not found</p>
        <Link href="/apps/projectshub" className="text-sm text-indigo-deep mt-2 inline-block">Back to projects</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Link href="/apps/projectshub" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-4 transition">
        <ArrowLeft className="size-4" /> All Projects
      </Link>

      {/* Header */}
      <div className="bg-white p-6 mb-4" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-xl font-bold text-ink-800">{project.name}</h1>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
            {canManage && (
              <>
                <button
                  onClick={startEditing}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-indigo-deep hover:bg-indigo-50 transition"
                  title="Edit project"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition"
                  title="Delete project"
                >
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
        {project.description && <p className="text-sm text-ink-500 mb-3">{project.description}</p>}
        <div className="flex items-center gap-4 text-xs text-ink-400">
          <span className="flex items-center gap-1"><Users className="size-3.5" /> {project.memberCount} members</span>
          {project.department && <span>{project.department}</span>}
          {project.startDate && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {project.endDate && ` – ${new Date(project.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
            </span>
          )}
        </div>
        {project.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {project.requiredSkills.map((s) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-deep border border-indigo-100">{s}</span>
            ))}
          </div>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="bg-white p-6 mb-4" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-800">Edit Project</h2>
            <button onClick={() => setEditing(false)} className="text-ink-400 hover:text-ink-600 transition"><X className="size-5" /></button>
          </div>
          <form onSubmit={updateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Project Name *</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Project name" className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Description</label>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="What is this project about?" rows={3} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Department</label>
                <input type="text" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} placeholder="e.g., Engineering" className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition">
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">Start Date</label>
                <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1.5">End Date</label>
                <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Required Skills</label>
              <div className="flex gap-2">
                <input type="text" value={editSkillInput} onChange={(e) => setEditSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEditSkill(); } }} placeholder="Type a skill and press Enter" className="flex-1 rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition" />
                <button type="button" onClick={addEditSkill} className="rounded-xl bg-ink-100 px-3 py-2.5 text-sm hover:bg-ink-200 transition"><Plus className="size-4" /></button>
              </div>
              {editSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {editSkills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-deep border border-indigo-100">
                      {skill}
                      <button type="button" onClick={() => setEditSkills(editSkills.filter((s) => s !== skill))} className="hover:text-red-500 transition"><X className="size-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-xl border border-ink-200 py-2.5 text-sm font-medium text-ink-600 hover:bg-ink-50 transition">Cancel</button>
              <button type="submit" disabled={!editName.trim() || editSubmitting} className="flex-1 rounded-xl bg-indigo-deep py-2.5 text-sm font-medium text-white hover:bg-indigo-press transition disabled:opacity-50 flex items-center justify-center gap-2">
                {editSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />}
                {editSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white p-1" style={{ borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {TABS.filter((t) => t.key !== "skills" || canManage).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); if (t.key === "skills" && skillMatches.length === 0) runSkillMatch(); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm rounded-xl transition font-medium ${tab === t.key ? "bg-indigo-deep text-white shadow-sm" : "text-ink-500 hover:text-ink-700 hover:bg-ink-50"}`}
            >
              <Icon className="size-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={`relative overflow-hidden p-6 ${tab === "skills" ? "bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-teal-50/60" : "bg-white"}`} style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {tab === "skills" && (
          <>
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-teal-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-r from-purple-400/10 to-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
          </>
        )}
        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800">Milestones</h2>
              {canManage && (
                <button onClick={() => setShowMilestoneForm(!showMilestoneForm)} className="text-sm text-indigo-deep hover:underline flex items-center gap-1">
                  <Plus className="size-3.5" /> Add milestone
                </button>
              )}
            </div>

            {showMilestoneForm && canManage && (
              <form onSubmit={addMilestone} className="flex gap-2 mb-4">
                <input type="text" value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="Milestone title" className="flex-1 rounded-xl border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20" required />
                <input type="date" value={msDate} onChange={(e) => setMsDate(e.target.value)} className="rounded-xl border border-ink-200 px-3 py-2 text-sm" />
                <button type="submit" disabled={msSubmitting} className="rounded-xl bg-indigo-deep px-4 py-2 text-sm text-white hover:bg-indigo-press transition disabled:opacity-50">
                  {msSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Add"}
                </button>
              </form>
            )}

            {milestones.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-6">No milestones yet</p>
            ) : (
              <div className="space-y-2">
                {milestones.map((ms) => {
                  const StatusIcon = MS_STATUS_ICON[ms.status] ?? Clock;
                  return (
                    <div key={ms.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-50/50">
                      <StatusIcon className={`size-5 shrink-0 ${ms.status === "completed" ? "text-emerald-500" : "text-ink-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${ms.status === "completed" ? "line-through text-ink-400" : "text-ink-800"}`}>{ms.title}</p>
                        {ms.targetDate && <p className="text-xs text-ink-400">{new Date(ms.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>}
                      </div>
                      {ms.status !== "completed" && canManage && (
                        <button onClick={() => completeMilestone(ms)} className="text-xs text-emerald-600 hover:underline">Complete</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Team */}
        {tab === "team" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800">Team Members ({members.length})</h2>
              {canManage && (
                <button onClick={() => setShowAddMember(!showAddMember)} className="text-sm text-indigo-deep hover:underline flex items-center gap-1">
                  <UserPlus className="size-3.5" /> Add member
                </button>
              )}
            </div>

            {showAddMember && canManage && (
              <div className="mb-4 p-4 rounded-xl border border-ink-200 bg-ink-50/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-400" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => searchUsers(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-ink-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition"
                  />
                  {memberSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-ink-400" />}
                </div>
                {memberResults.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {memberResults.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white hover:bg-ink-50 transition">
                        <Avatar name={u.name} avatar={u.avatar_url} size={32} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-800">{u.name}</p>
                          <p className="text-xs text-ink-400">{u.email}</p>
                        </div>
                        <button
                          onClick={() => { addMember(u.id); setMemberSearch(""); setMemberResults([]); }}
                          disabled={addingMember === u.id}
                          className="rounded-lg bg-indigo-deep px-3 py-1.5 text-xs text-white hover:bg-indigo-press transition disabled:opacity-50 flex items-center gap-1"
                        >
                          {addingMember === u.id ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {memberSearch.trim().length >= 2 && !memberSearching && memberResults.length === 0 && (
                  <p className="text-xs text-ink-400 text-center mt-3">No users found</p>
                )}
              </div>
            )}

            {members.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-6">No members yet</p>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-50/50">
                    <Avatar name={m.userName} avatar={m.userAvatar} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800">{m.userName ?? "Unknown"}</p>
                      <p className="text-xs text-ink-400">{m.userEmail}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === "lead" ? "bg-indigo-50 text-indigo-deep" : "bg-ink-100 text-ink-600"}`}>
                      {m.role}
                    </span>
                    {canManage && (
                      <button onClick={() => setRemoveMemberTarget(m)} className="text-ink-400 hover:text-red-500 transition" title="Remove member">
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skill Match */}
        {tab === "skills" && (
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800 flex items-center gap-2">
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">AI</span>
                Skill-Based Suggestions
              </h2>
              <button onClick={runSkillMatch} disabled={matchLoading} className="text-sm text-indigo-deep hover:underline flex items-center gap-1">
                {matchLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} Refresh
              </button>
            </div>
            <p className="text-xs text-ink-400 mb-4 flex items-center gap-1">
              <Sparkles className="size-3 text-purple-400" /> Matched against project&apos;s required skills using employee skill profiles
            </p>

            {project.requiredSkills.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-6">Add required skills to the project to see matches</p>
            ) : matchLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-purple-400" /></div>
            ) : skillMatches.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-6">No matching employees found</p>
            ) : (
              <div className="space-y-2">
                {skillMatches.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-white/80">
                    <Avatar name={m.name} avatar={m.avatarUrl} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-800">{m.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {m.matchedSkills.map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-semibold text-indigo-deep">{m.matchScore}%</span>
                      <p className="text-[10px] text-ink-400">match</p>
                    </div>
                    <button
                      onClick={() => addMember(m.userId)}
                      disabled={addingMember === m.userId}
                      className="rounded-lg bg-indigo-deep px-3 py-1.5 text-xs text-white hover:bg-indigo-press transition disabled:opacity-50 flex items-center gap-1"
                    >
                      {addingMember === m.userId ? <Loader2 className="size-3 animate-spin" /> : <UserPlus className="size-3" />}
                      Add
                    </button>
                  </div>
                ))}
            </div>
            )}
          </div>
        )}

        {/* Channels */}
        {tab === "channels" && (
          <div>
            {/* Channel list */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {channels.map((ch) => (
                <div key={ch.id} className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => setActiveChannel(ch.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${activeChannel === ch.id ? "bg-indigo-deep text-white" : "bg-ink-50 text-ink-600 hover:bg-ink-100"}`}
                  >
                    # {ch.name}
                  </button>
                  {canManage && activeChannel === ch.id && ch.name !== "General" && (
                    <div className="flex items-center">
                      <button
                        onClick={() => { setRenameTarget(ch); setRenameValue(ch.name); }}
                        className="p-1 rounded text-ink-300 hover:text-indigo-deep hover:bg-indigo-50 transition"
                        title="Rename channel"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        onClick={() => setDeleteChannelTarget(ch)}
                        className="p-1 rounded text-ink-300 hover:text-red-500 hover:bg-red-50 transition"
                        title="Delete channel"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {canManage && (
                <button
                  onClick={() => setShowChannelForm(!showChannelForm)}
                  className="shrink-0 p-1.5 rounded-lg text-ink-400 hover:text-indigo-deep hover:bg-indigo-50 transition"
                  title="Create channel"
                >
                  <Plus className="size-4" />
                </button>
              )}
            </div>

            {/* Rename channel form */}
            {renameTarget && (
              <form onSubmit={handleRenameChannel} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="flex-1 rounded-xl border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20"
                  required
                />
                <button type="submit" disabled={renamingChannel || !renameValue.trim()} className="rounded-xl bg-indigo-deep px-4 py-2 text-sm text-white hover:bg-indigo-press transition disabled:opacity-50">
                  {renamingChannel ? <Loader2 className="size-4 animate-spin" /> : "Rename"}
                </button>
                <button type="button" onClick={() => setRenameTarget(null)} className="rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-500 hover:bg-ink-50 transition">
                  Cancel
                </button>
              </form>
            )}

            {showChannelForm && canManage && (
              <form onSubmit={createNewChannel} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Channel name"
                  className="flex-1 rounded-xl border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20"
                  required
                />
                <button type="submit" disabled={creatingChannel} className="rounded-xl bg-indigo-deep px-4 py-2 text-sm text-white hover:bg-indigo-press transition disabled:opacity-50">
                  {creatingChannel ? <Loader2 className="size-4 animate-spin" /> : "Create"}
                </button>
                <button type="button" onClick={() => { setShowChannelForm(false); setChannelName(""); }} className="rounded-xl border border-ink-200 px-3 py-2 text-sm text-ink-500 hover:bg-ink-50 transition">
                  Cancel
                </button>
              </form>
            )}

            {activeChannel && (
              <>
                {/* Messages */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4 pr-1">
                  {msgLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-ink-400" /></div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-ink-400 text-center py-8">No messages yet. Start the conversation!</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="group flex gap-2.5">
                        <Avatar name={msg.userName} avatar={msg.userAvatar} size={28} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-ink-800">{msg.userName ?? "Unknown"}</span>
                            <span className="text-[10px] text-ink-400">{new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                            {msg.pinned && <Pin className="size-3 text-amber-500" />}
                          </div>
                          {msg.parentMessage && (
                            <div className="text-[11px] text-ink-400 border-l-2 border-ink-200 pl-2 mb-0.5 line-clamp-1">
                              {msg.parentMessage.userName}: {msg.parentMessage.body}
                            </div>
                          )}
                          <p className="text-sm text-ink-700">{msg.body}</p>
                          <div className="flex gap-2 mt-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button onClick={() => setReplyTo(msg)} className="text-[10px] text-ink-400 hover:text-indigo-deep flex items-center gap-0.5"><Reply className="size-3" /> Reply</button>
                            <button onClick={() => handlePin(msg.id)} className="text-[10px] text-ink-400 hover:text-amber-500 flex items-center gap-0.5"><Pin className="size-3" /> {msg.pinned ? "Unpin" : "Pin"}</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply indicator */}
                {replyTo && (
                  <div className="flex items-center gap-2 text-xs text-ink-500 bg-ink-50 rounded-lg px-3 py-1.5 mb-2">
                    <Reply className="size-3" />
                    Replying to {replyTo.userName}: {replyTo.body.slice(0, 50)}{replyTo.body.length > 50 ? "..." : ""}
                    <button onClick={() => setReplyTo(null)} className="ml-auto"><X className="size-3" /></button>
                  </div>
                )}

                {/* Send */}
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-ink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 transition"
                  />
                  <button type="submit" disabled={!msgBody.trim() || sendingMsg} className="rounded-xl bg-indigo-deep px-4 py-2.5 text-white hover:bg-indigo-press transition disabled:opacity-50">
                    {sendingMsg ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete channel confirmation */}
      <AlertDialog open={!!deleteChannelTarget} onOpenChange={(open) => { if (!open) setDeleteChannelTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete channel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>#{deleteChannelTarget?.name}</strong> and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingChannel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChannel}
              disabled={deletingChannel}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deletingChannel ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove member confirmation */}
      <AlertDialog open={!!removeMemberTarget} onOpenChange={(open) => { if (!open) setRemoveMemberTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removeMemberTarget?.userName ?? "this member"}</strong> from the project?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{project.name}</strong> and all its members, milestones, channels, and messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingProject}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteProject}
              disabled={deletingProject}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deletingProject ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
