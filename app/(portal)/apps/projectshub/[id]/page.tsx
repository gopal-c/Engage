"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, Users, Target, MessageSquare, Sparkles, Plus, X,
  Calendar, CheckCircle2, Clock, Loader2, Pin, Send, Reply, UserPlus, Trash2,
} from "lucide-react";
import { toast } from "sonner";

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

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState<string>("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  // Team tab
  const [skillMatches, setSkillMatches] = useState<SkillMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);

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

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projectshub/projects/${id}`);
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
        setMembers(data.members ?? []);
        setMilestones(data.milestones ?? []);
        setChannels(data.channels ?? []);
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

  async function removeMember(userId: string) {
    try {
      await fetch(`/api/projectshub/projects/${id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      toast.success("Member removed");
      fetchProject();
    } catch { toast.error("Failed"); }
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

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="h-40 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-4xl text-center py-20">
        <p className="text-lg font-semibold text-ink-800">Project not found</p>
        <Link href="/apps/projectshub" className="text-sm text-indigo-deep mt-2 inline-block">Back to projects</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/apps/projectshub" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-4 transition">
        <ArrowLeft className="size-4" /> All Projects
      </Link>

      {/* Header */}
      <div className="bg-white p-6 mb-4" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-xl font-bold text-ink-800">{project.name}</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_COLORS[project.status]}`}>
            {STATUS_LABELS[project.status]}
          </span>
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

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white p-1" style={{ borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        {TABS.map((t) => {
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
      <div className="bg-white p-6" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800">Milestones</h2>
              <button onClick={() => setShowMilestoneForm(!showMilestoneForm)} className="text-sm text-indigo-deep hover:underline flex items-center gap-1">
                <Plus className="size-3.5" /> Add milestone
              </button>
            </div>

            {showMilestoneForm && (
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
                      {ms.status !== "completed" && (
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
            <h2 className="font-semibold text-ink-800 mb-4">Team Members ({members.length})</h2>
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
                    {m.role !== "lead" && (
                      <button onClick={() => removeMember(m.userId)} className="text-ink-400 hover:text-red-500 transition" title="Remove">
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
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800">Skill-Based Suggestions</h2>
              <button onClick={runSkillMatch} disabled={matchLoading} className="text-sm text-indigo-deep hover:underline flex items-center gap-1">
                {matchLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />} Refresh
              </button>
            </div>

            {project.requiredSkills.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-6">Add required skills to the project to see matches</p>
            ) : matchLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-ink-400" /></div>
            ) : skillMatches.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-6">No matching employees found</p>
            ) : (
              <div className="space-y-2">
                {skillMatches.map((m) => (
                  <div key={m.userId} className="flex items-center gap-3 p-3 rounded-xl bg-ink-50/50">
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
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-sm transition ${activeChannel === ch.id ? "bg-indigo-deep text-white" : "bg-ink-50 text-ink-600 hover:bg-ink-100"}`}
                >
                  # {ch.name}
                </button>
              ))}
            </div>

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
    </div>
  );
}
