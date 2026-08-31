"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, Plus, FolderKanban, Users, Calendar, ChevronDown, ChevronLeft,
  MessageSquare, Sparkles, Target, Send, Reply, Pin, X, Loader2, UserPlus,
  Trash2, Pencil, Clock, CheckCircle2, Hash, Bell, ArrowRight,
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
type Channel = { id: string; name: string; messageCount?: number };
type Message = {
  id: string; body: string; userId: string; userName?: string; userAvatar?: string | null;
  parentId: string | null; pinned: boolean; createdAt: string;
  parentMessage?: { body: string; userName: string } | null;
};
type SkillMatch = {
  userId: string; name: string; email: string; avatarUrl: string | null;
  matchedSkills: string[]; matchScore: number; seniority: string | null;
};
type JoinRequest = {
  id: string; userId: string; userName?: string; userAvatar?: string | null;
  userEmail?: string; message: string | null; status: string; createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-slate-50 text-slate-700 border-slate-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  on_hold: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-zinc-50 text-zinc-500 border-zinc-200",
};
const STATUS_DOT: Record<string, string> = {
  planning: "bg-slate-400", active: "bg-emerald-500", on_hold: "bg-amber-500",
  completed: "bg-blue-500", archived: "bg-zinc-400",
};
const STATUS_LABELS: Record<string, string> = {
  planning: "Planning", active: "Active", on_hold: "On Hold", completed: "Completed", archived: "Archived",
};

function Avatar({ name, avatar, size = 32 }: { name?: string; avatar?: string | null; size?: number }) {
  if (avatar) return <img src={avatar} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  const initial = (name ?? "?")[0].toUpperCase();
  return (
    <div className="rounded-full bg-indigo-100 text-indigo-deep flex items-center justify-center font-medium text-xs" style={{ width: size, height: size }}>
      {initial}
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export default function ProjectsHubPage() {
  // Project list
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // Right panel - no tabs, all sections shown as stacked cards

  // Channel messaging
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgBody, setMsgBody] = useState("");
  const [msgLoading, setMsgLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Channel CRUD
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Channel | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingChannel, setRenamingChannel] = useState(false);
  const [deleteChannelTarget, setDeleteChannelTarget] = useState<Channel | null>(null);
  const [deletingChannel, setDeletingChannel] = useState(false);

  // Skill match
  const [skillMatches, setSkillMatches] = useState<SkillMatch[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [addingMember, setAddingMember] = useState<string | null>(null);

  // Manual add member
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<{ id: string; name: string; email: string; avatar_url: string | null }[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  // Join request
  const [joinRequestStatus, setJoinRequestStatus] = useState<string | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [submittingJoin, setSubmittingJoin] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [reviewingRequest, setReviewingRequest] = useState<string | null>(null);

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

  // Milestones
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [msTitle, setMsTitle] = useState("");
  const [msDate, setMsDate] = useState("");
  const [msSubmitting, setMsSubmitting] = useState(false);

  // Remove member
  const [removeMemberTarget, setRemoveMemberTarget] = useState<Member | null>(null);

  // Delete project
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // Mobile view state
  const [mobileView, setMobileView] = useState<"list" | "chat" | "info">("list");

  // Handle ?project= query param for deep links
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("project");
  const [initialHandled, setInitialHandled] = useState(false);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    try {
      const res = await fetch(`/api/projectshub/projects?${params}`);
      const data = await res.json();
      setProjects(data.projects ?? []);
      if (data.canManage !== undefined) setCanManage(data.canManage);
    } catch { /* */ }
    setLoading(false);
  }, [statusFilter, search]);

  // Fetch unread counts
  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/projectshub/unread");
      const data = await res.json();
      setUnreadCounts(data.unread ?? {});
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { fetchUnread(); const iv = setInterval(fetchUnread, 30000); return () => clearInterval(iv); }, [fetchUnread]);

  useEffect(() => {
    if (initialProjectId && !initialHandled) {
      setSelectedProjectId(initialProjectId);
      setMobileView("chat");
      setInitialHandled(true);
    }
  }, [initialProjectId, initialHandled]);

  // Auto-select first project when list loads
  useEffect(() => {
    if (!loading && projects.length > 0 && !selectedProjectId && !initialProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [loading, projects, selectedProjectId, initialProjectId]);

  // Fetch selected project
  const fetchProject = useCallback(async (pid: string) => {
    setProjectLoading(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${pid}`);
      const data = await res.json();
      if (data.project) {
        setProject(data.project);
        setMembers(data.members ?? []);
        setMilestones(data.milestones ?? []);
        setChannels(data.channels ?? []);
        if (data.canManage !== undefined) setCanManage(data.canManage);
        setIsMember(data.isMember ?? false);
        if (data.channels?.length > 0) {
          setActiveChannel(data.channels[0].id);
        }
      }
    } catch { /* */ }
    setProjectLoading(false);
  }, []);

  // Fetch join request status when selecting a project
  const fetchJoinStatus = useCallback(async (pid: string) => {
    try {
      const res = await fetch(`/api/projectshub/projects/${pid}/join-requests`);
      const data = await res.json();
      if (data.requests) {
        setJoinRequests(data.requests ?? []);
        setPendingCount(data.pendingCount ?? 0);
      }
      if (data.myRequest) {
        setJoinRequestStatus(data.myRequest.status);
      } else {
        setJoinRequestStatus(null);
      }
    } catch { /* */ }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProject(selectedProjectId);
      fetchJoinStatus(selectedProjectId);
      setEditing(false);
      setSkillMatches([]);
      setShowAddMember(false);
    }
  }, [selectedProjectId, fetchProject, fetchJoinStatus]);

  // Fetch messages
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
    if (activeChannel) {
      fetchMessages(activeChannel);
      fetch(`/api/projectshub/channels/${activeChannel}/read`, { method: "POST" }).catch(() => {});
    }
  }, [activeChannel, fetchMessages]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling for new messages
  useEffect(() => {
    if (!activeChannel) return;
    const iv = setInterval(() => fetchMessages(activeChannel), 10000);
    return () => clearInterval(iv);
  }, [activeChannel, fetchMessages]);

  function selectProject(pid: string) {
    setSelectedProjectId(pid);
    setMobileView("chat");
  }

  // --- Actions ---
  async function runSkillMatch() {
    if (!project?.requiredSkills.length) return;
    setMatchLoading(true);
    try {
      const res = await fetch("/api/projectshub/skill-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requiredSkills: project.requiredSkills, excludeUserIds: members.map((m) => m.userId) }),
      });
      const data = await res.json();
      setSkillMatches(data.matches ?? []);
    } catch { /* */ }
    setMatchLoading(false);
  }

  async function addMember(userId: string, role = "member") {
    if (!selectedProjectId) return;
    setAddingMember(userId);
    try {
      const res = await fetch(`/api/projectshub/projects/${selectedProjectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Member added!");
        fetchProject(selectedProjectId);
        setSkillMatches((prev) => prev.filter((m) => m.userId !== userId));
      } else toast.error(data.error || "Failed");
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
    if (!removeMemberTarget || !selectedProjectId) return;
    try {
      await fetch(`/api/projectshub/projects/${selectedProjectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: removeMemberTarget.userId }),
      });
      toast.success("Member removed");
      fetchProject(selectedProjectId);
    } catch { toast.error("Failed"); }
    setRemoveMemberTarget(null);
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
      if (data.ok) { setMsgBody(""); setReplyTo(null); fetchMessages(activeChannel); }
      else toast.error(data.error || "Failed");
    } catch { toast.error("Failed"); }
    setSendingMsg(false);
  }

  async function handlePin(messageId: string) {
    if (!activeChannel) return;
    try {
      await fetch(`/api/projectshub/channels/${activeChannel}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      fetchMessages(activeChannel);
    } catch { /* */ }
  }

  async function createNewChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!channelName.trim() || !selectedProjectId) return;
    setCreatingChannel(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${selectedProjectId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: channelName.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Channel created!");
        setChannelName(""); setShowChannelForm(false);
        fetchProject(selectedProjectId);
        setActiveChannel(data.channelId);
      } else toast.error(data.error || "Failed");
    } catch { toast.error("Failed"); }
    setCreatingChannel(false);
  }

  async function handleRenameChannel(e: React.FormEvent) {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim() || !selectedProjectId) return;
    setRenamingChannel(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${selectedProjectId}/channels`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: renameTarget.id, name: renameValue.trim() }),
      });
      const data = await res.json();
      if (data.ok) { toast.success("Renamed!"); setRenameTarget(null); fetchProject(selectedProjectId); }
      else toast.error(data.error || "Failed");
    } catch { toast.error("Failed"); }
    setRenamingChannel(false);
  }

  async function handleDeleteChannel() {
    if (!deleteChannelTarget || !selectedProjectId) return;
    setDeletingChannel(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${selectedProjectId}/channels`, {
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
        fetchProject(selectedProjectId);
      } else toast.error(data.error || "Failed");
    } catch { toast.error("Failed"); }
    setDeletingChannel(false);
    setDeleteChannelTarget(null);
  }

  async function submitJoinRequest() {
    if (!selectedProjectId) return;
    setSubmittingJoin(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${selectedProjectId}/join-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: joinMessage.trim() || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Join request sent!");
        setJoinRequestStatus("pending");
        setJoinMessage("");
      } else toast.error(data.error || "Failed");
    } catch { toast.error("Failed"); }
    setSubmittingJoin(false);
  }

  async function reviewRequest(requestId: string, action: "approved" | "rejected") {
    if (!selectedProjectId) return;
    setReviewingRequest(requestId);
    try {
      const res = await fetch(`/api/projectshub/projects/${selectedProjectId}/join-requests`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(action === "approved" ? "Approved!" : "Rejected");
        fetchJoinStatus(selectedProjectId);
        if (action === "approved") fetchProject(selectedProjectId);
      } else toast.error(data.error || "Failed");
    } catch { toast.error("Failed"); }
    setReviewingRequest(null);
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
    if (!editName.trim() || !selectedProjectId) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${selectedProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(), description: editDescription.trim() || undefined,
          department: editDepartment.trim() || undefined, startDate: editStartDate || undefined,
          endDate: editEndDate || undefined, requiredSkills: editSkills, status: editStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) { toast.success("Updated!"); setEditing(false); fetchProject(selectedProjectId); fetchProjects(); }
      else toast.error(data.error || "Failed");
    } catch { toast.error("Failed"); }
    setEditSubmitting(false);
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!msTitle.trim() || !selectedProjectId) return;
    setMsSubmitting(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${selectedProjectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: msTitle.trim(), targetDate: msDate || undefined }),
      });
      const data = await res.json();
      if (data.ok) { toast.success("Milestone added!"); setMsTitle(""); setMsDate(""); setShowMilestoneForm(false); fetchProject(selectedProjectId); }
    } catch { toast.error("Failed"); }
    setMsSubmitting(false);
  }

  async function completeMilestone(ms: Milestone) {
    if (!selectedProjectId) return;
    try {
      await fetch(`/api/projectshub/projects/${selectedProjectId}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: ms.id, title: ms.title, status: "completed" }),
      });
      toast.success("Completed!");
      fetchProject(selectedProjectId);
    } catch { toast.error("Failed"); }
  }

  async function deleteProject() {
    if (!selectedProjectId) return;
    setDeletingProject(true);
    try {
      const res = await fetch(`/api/projectshub/projects/${selectedProjectId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) { toast.success("Deleted"); setSelectedProjectId(null); setProject(null); fetchProjects(); setMobileView("list"); }
      else toast.error(data.error || "Failed");
    } catch { toast.error("Failed"); }
    setDeletingProject(false);
    setShowDeleteConfirm(false);
  }

  // =============== RENDER ===============

  // LEFT PANEL: Project list
  const leftPanel = (
    <div className="flex flex-col h-full">
      {/* Search & filter */}
      <div className="p-3 border-b border-ink-100">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-ink-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 focus:border-indigo-deep transition"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 transition"
          >
            {statusFilter ? STATUS_LABELS[statusFilter] : "All Statuses"}
            <ChevronDown className="size-3" />
          </button>
          {showStatusDropdown && (
            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-ink-200 rounded-xl shadow-lg py-1 min-w-[140px]">
              <button onClick={() => { setStatusFilter(""); setShowStatusDropdown(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-ink-50">All Statuses</button>
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <button key={val} onClick={() => { setStatusFilter(val); setShowStatusDropdown(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-ink-50 flex items-center gap-2">
                  <span className={`size-2 rounded-full ${STATUS_DOT[val]}`} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="p-6 text-center">
            <FolderKanban className="size-8 text-ink-300 mx-auto mb-2" />
            <p className="text-sm text-ink-500">No projects found</p>
          </div>
        ) : (
          <div className="py-1">
            {projects.map((p) => {
              const isSelected = selectedProjectId === p.id;
              const unread = unreadCounts[p.id] || 0;
              return (
                <button
                  key={p.id}
                  onClick={() => selectProject(p.id)}
                  className={`w-full text-left px-4 py-3 transition border-l-2 ${
                    isSelected
                      ? "bg-indigo-50/60 border-l-indigo-deep"
                      : "border-l-transparent hover:bg-ink-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full shrink-0 ${STATUS_DOT[p.status] ?? STATUS_DOT.planning}`} />
                        <span className={`text-sm font-medium truncate ${isSelected ? "text-indigo-deep" : "text-ink-800"}`}>
                          {p.name}
                        </span>
                      </div>
                      {p.description && (
                        <p className="text-xs text-ink-400 line-clamp-1 mt-0.5 ml-4">{p.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[11px] text-ink-400 mt-1 ml-4">
                        <span className="flex items-center gap-0.5"><Users className="size-3" /> {p.memberCount}</span>
                        {p.department && <span>{p.department}</span>}
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="shrink-0 mt-0.5 bg-indigo-deep text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // CENTER PANEL: Channel messaging
  const centerPanel = project ? (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="px-4 py-3 border-b border-ink-100">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => { setMobileView("list"); }} className="lg:hidden p-1 -ml-1 rounded-lg hover:bg-ink-50 transition">
            <ChevronLeft className="size-5 text-ink-400" />
          </button>
          <h2 className="text-base font-bold text-ink-800 truncate">{project.name}</h2>
          <button onClick={() => setMobileView("info")} className="lg:hidden ml-auto p-1.5 rounded-lg hover:bg-ink-50 transition text-ink-400">
            <Users className="size-4" />
          </button>
        </div>

        {/* Channel tabs */}
        {(isMember || canManage) && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {channels.map((ch) => (
              <div key={ch.id} className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => setActiveChannel(ch.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition ${
                    activeChannel === ch.id ? "bg-indigo-deep text-white" : "bg-ink-50 text-ink-600 hover:bg-ink-100"
                  }`}
                >
                  <Hash className="size-3" /> {ch.name}
                </button>
                {canManage && activeChannel === ch.id && ch.name !== "General" && (
                  <>
                    <button onClick={() => { setRenameTarget(ch); setRenameValue(ch.name); }} className="p-0.5 rounded text-ink-300 hover:text-indigo-deep transition" title="Rename">
                      <Pencil className="size-2.5" />
                    </button>
                    <button onClick={() => setDeleteChannelTarget(ch)} className="p-0.5 rounded text-ink-300 hover:text-red-500 transition" title="Delete">
                      <Trash2 className="size-2.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            {canManage && (
              <button onClick={() => setShowChannelForm(!showChannelForm)} className="shrink-0 p-1 rounded-lg text-ink-400 hover:text-indigo-deep hover:bg-indigo-50 transition" title="New channel">
                <Plus className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Create channel form */}
        {showChannelForm && canManage && (
          <form onSubmit={createNewChannel} className="flex gap-2 mt-2">
            <input type="text" value={channelName} onChange={(e) => setChannelName(e.target.value)} placeholder="Channel name" className="flex-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20" required />
            <button type="submit" disabled={creatingChannel} className="rounded-lg bg-indigo-deep px-3 py-1.5 text-xs text-white hover:bg-indigo-press transition disabled:opacity-50">
              {creatingChannel ? <Loader2 className="size-3 animate-spin" /> : "Create"}
            </button>
            <button type="button" onClick={() => { setShowChannelForm(false); setChannelName(""); }} className="text-xs text-ink-400 hover:text-ink-600 transition">Cancel</button>
          </form>
        )}

        {/* Rename channel form */}
        {renameTarget && (
          <form onSubmit={handleRenameChannel} className="flex gap-2 mt-2">
            <input type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} className="flex-1 rounded-lg border border-ink-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20" required />
            <button type="submit" disabled={renamingChannel} className="rounded-lg bg-indigo-deep px-3 py-1.5 text-xs text-white hover:bg-indigo-press transition disabled:opacity-50">
              {renamingChannel ? <Loader2 className="size-3 animate-spin" /> : "Rename"}
            </button>
            <button type="button" onClick={() => setRenameTarget(null)} className="text-xs text-ink-400 hover:text-ink-600 transition">Cancel</button>
          </form>
        )}
      </div>

      {/* Messages area */}
      {!isMember && !canManage ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-xs">
            <MessageSquare className="size-10 text-ink-300 mx-auto mb-3" />
            <p className="text-sm text-ink-500 mb-4">Join this project to participate in channel discussions</p>
            {joinRequestStatus === "pending" ? (
              <p className="text-sm text-amber-600 flex items-center justify-center gap-1"><Clock className="size-4" /> Request pending</p>
            ) : joinRequestStatus === "rejected" ? (
              <div>
                <p className="text-sm text-red-500 mb-2">Your request was declined</p>
                <button onClick={submitJoinRequest} disabled={submittingJoin} className="rounded-xl bg-indigo-deep px-4 py-2 text-sm text-white hover:bg-indigo-press transition disabled:opacity-50">
                  {submittingJoin ? <Loader2 className="size-4 animate-spin" /> : "Request Again"}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  placeholder="Why do you want to join? (optional)"
                  rows={2}
                  className="w-full rounded-xl border border-ink-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 resize-none"
                />
                <button onClick={submitJoinRequest} disabled={submittingJoin} className="w-full rounded-xl bg-indigo-deep px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-press transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {submittingJoin ? <Loader2 className="size-4 animate-spin" /> : <><UserPlus className="size-4" /> Request to Join</>}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : activeChannel ? (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {msgLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-ink-400" /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="size-8 text-ink-300 mb-2" />
                <p className="text-sm text-ink-400">No messages yet. Start the conversation!</p>
              </div>
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
            <div ref={messagesEndRef} />
          </div>

          {/* Reply indicator */}
          {replyTo && (
            <div className="flex items-center gap-2 text-xs text-ink-500 bg-ink-50 mx-4 rounded-lg px-3 py-1.5">
              <Reply className="size-3" />
              <span className="truncate">Replying to {replyTo.userName}: {replyTo.body.slice(0, 50)}{replyTo.body.length > 50 ? "..." : ""}</span>
              <button onClick={() => setReplyTo(null)} className="ml-auto shrink-0"><X className="size-3" /></button>
            </div>
          )}

          {/* Message input */}
          <div className="p-3 border-t border-ink-100">
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
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-ink-400">No channels available</p>
        </div>
      )}
    </div>
  ) : (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <FolderKanban className="size-12 text-ink-200 mx-auto mb-3" />
        <p className="text-base font-medium text-ink-500 mb-1">Select a project</p>
        <p className="text-sm text-ink-400">Choose a project from the left to view channels and collaborate</p>
      </div>
    </div>
  );

  // RIGHT PANEL: Stacked cards — project info, AI match, team
  const rightPanel = project ? (
    <div className="flex flex-col h-full">
      {/* Mobile back button */}
      <div className="lg:hidden px-4 py-2 border-b border-ink-100">
        <button onClick={() => setMobileView("chat")} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 transition">
          <ChevronLeft className="size-4" /> Back to chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Project Info Card */}
        <div className="bg-white rounded-2xl border border-ink-100 p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Target className="size-3.5 text-indigo-deep" />
            <h4 className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Project Info</h4>
          </div>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-ink-800 text-sm">{project.name}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status]}`}>
              {STATUS_LABELS[project.status]}
            </span>
          </div>
          {project.description && <p className="text-xs text-ink-500 mb-3">{project.description}</p>}
          <div className="space-y-1.5 text-xs text-ink-400">
            <div className="flex items-center gap-1.5"><Users className="size-3" /> {project.memberCount} members</div>
            {project.department && <div className="flex items-center gap-1.5"><FolderKanban className="size-3" /> {project.department}</div>}
            {project.startDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3" />
                {new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {project.endDate && ` – ${new Date(project.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
              </div>
            )}
          </div>
          {project.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {project.requiredSkills.map((s) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-deep border border-indigo-100">{s}</span>
              ))}
            </div>
          )}
          {canManage && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-ink-100">
              <button onClick={startEditing} className="flex items-center gap-1 text-xs text-indigo-deep hover:underline"><Pencil className="size-3" /> Edit</button>
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1 text-xs text-red-500 hover:underline"><Trash2 className="size-3" /> Delete</button>
            </div>
          )}

          {/* Edit form inline */}
          {editing && (
            <div className="mt-3 pt-3 border-t border-ink-100">
              <form onSubmit={updateProject} className="space-y-3">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Project name" className="w-full rounded-lg border border-ink-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20" required />
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" rows={2} className="w-full rounded-lg border border-ink-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 resize-none" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} placeholder="Department" className="rounded-lg border border-ink-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20" />
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="rounded-lg border border-ink-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20">
                    {Object.entries(STATUS_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className="rounded-lg border border-ink-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20" />
                  <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="rounded-lg border border-ink-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20" />
                </div>
                <div>
                  <div className="flex gap-1.5">
                    <input type="text" value={editSkillInput} onChange={(e) => setEditSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEditSkill(); } }} placeholder="Add skill" className="flex-1 rounded-lg border border-ink-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20" />
                    <button type="button" onClick={addEditSkill} className="rounded-lg bg-ink-100 px-2 py-2 text-xs hover:bg-ink-200 transition"><Plus className="size-3" /></button>
                  </div>
                  {editSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {editSkills.map((s) => (
                        <span key={s} className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-deep border border-indigo-100">
                          {s} <button type="button" onClick={() => setEditSkills(editSkills.filter((sk) => sk !== s))} className="hover:text-red-500"><X className="size-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-ink-200 py-2 text-xs text-ink-500 hover:bg-ink-50 transition">Cancel</button>
                  <button type="submit" disabled={!editName.trim() || editSubmitting} className="flex-1 rounded-lg bg-indigo-deep py-2 text-xs text-white hover:bg-indigo-press transition disabled:opacity-50 flex items-center justify-center gap-1">
                    {editSubmitting ? <Loader2 className="size-3 animate-spin" /> : "Save"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Milestones section */}
          <div className="mt-3 pt-3 border-t border-ink-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Milestones</span>
              {canManage && (
                <button onClick={() => setShowMilestoneForm(!showMilestoneForm)} className="text-[10px] text-indigo-deep hover:underline flex items-center gap-0.5"><Plus className="size-3" /> Add</button>
              )}
            </div>
            {showMilestoneForm && canManage && (
              <form onSubmit={addMilestone} className="flex gap-1.5 mb-3">
                <input type="text" value={msTitle} onChange={(e) => setMsTitle(e.target.value)} placeholder="Title" className="flex-1 rounded-lg border border-ink-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20" required />
                <input type="date" value={msDate} onChange={(e) => setMsDate(e.target.value)} className="rounded-lg border border-ink-200 px-2 py-1.5 text-xs w-28" />
                <button type="submit" disabled={msSubmitting} className="rounded-lg bg-indigo-deep px-2 py-1.5 text-xs text-white hover:bg-indigo-press transition disabled:opacity-50">
                  {msSubmitting ? <Loader2 className="size-3 animate-spin" /> : "Add"}
                </button>
              </form>
            )}
            {milestones.length === 0 ? (
              <p className="text-xs text-ink-400 text-center py-2">No milestones</p>
            ) : (
              <div className="space-y-1.5">
                {milestones.map((ms) => (
                  <div key={ms.id} className="flex items-center gap-2 p-2 rounded-lg bg-ink-50/50">
                    {ms.status === "completed" ? <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" /> : <Clock className="size-3.5 text-ink-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${ms.status === "completed" ? "line-through text-ink-400" : "text-ink-800"}`}>{ms.title}</p>
                      {ms.targetDate && <p className="text-[10px] text-ink-400">{new Date(ms.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>}
                    </div>
                    {ms.status !== "completed" && canManage && (
                      <button onClick={() => completeMilestone(ms)} className="text-[10px] text-emerald-600 hover:underline">Done</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Skill Match Card */}
        {canManage && (
          <div className="relative rounded-2xl border border-ink-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-teal-50/60 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-400/15 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-ink-600 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-purple-400" />
                  <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-bold">AI</span>
                  Skill Match
                </h4>
                <button onClick={() => { if (skillMatches.length === 0) runSkillMatch(); else runSkillMatch(); }} disabled={matchLoading} className="text-[10px] text-indigo-deep hover:underline flex items-center gap-0.5">
                  {matchLoading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} {skillMatches.length === 0 ? "Find Matches" : "Refresh"}
                </button>
              </div>
              <p className="text-[10px] text-ink-400 flex items-center gap-1">
                Matched against project&apos;s required skills
              </p>

              {project.requiredSkills.length === 0 ? (
                <p className="text-xs text-ink-400 text-center py-3">Add required skills to see matches</p>
              ) : matchLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-purple-400" /></div>
              ) : skillMatches.length === 0 ? (
                <p className="text-xs text-ink-400 text-center py-3">Click &ldquo;Find Matches&rdquo; to discover talent</p>
              ) : (
                <div className="space-y-2">
                  {skillMatches.map((m) => (
                    <div key={m.userId} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/80">
                      <Avatar name={m.name} avatar={m.avatarUrl} size={30} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink-800">{m.name}</p>
                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                          {m.matchedSkills.map((s) => (
                            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{s}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0 mr-1">
                        <span className="text-xs font-semibold text-indigo-deep">{m.matchScore}%</span>
                      </div>
                      <button
                        onClick={() => addMember(m.userId)}
                        disabled={addingMember === m.userId}
                        className="shrink-0 rounded-lg bg-indigo-deep p-1.5 text-white hover:bg-indigo-press transition disabled:opacity-50"
                      >
                        {addingMember === m.userId ? <Loader2 className="size-3 animate-spin" /> : <UserPlus className="size-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Team Card */}
        <div className="bg-white rounded-2xl border border-ink-100 p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-ink-600 uppercase tracking-wide flex items-center gap-1.5">
              <Users className="size-3.5 text-indigo-deep" />
              Team ({members.length})
            </h4>
            {canManage && (
              <button onClick={() => setShowAddMember(!showAddMember)} className="text-[10px] text-indigo-deep hover:underline flex items-center gap-0.5"><UserPlus className="size-3" /> Add</button>
            )}
          </div>

          {showAddMember && canManage && (
            <div className="p-2.5 rounded-xl border border-ink-200 bg-ink-50/30 mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-ink-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => searchUsers(e.target.value)}
                  placeholder="Search name or email..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-ink-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-deep/20 transition"
                />
                {memberSearching && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3 animate-spin text-ink-400" />}
              </div>
              {memberResults.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {memberResults.map((u) => (
                    <div key={u.id} className="flex items-center gap-2 p-2 rounded-lg bg-white hover:bg-ink-50 transition">
                      <Avatar name={u.name} avatar={u.avatar_url} size={24} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink-800 truncate">{u.name}</p>
                        <p className="text-[10px] text-ink-400 truncate">{u.email}</p>
                      </div>
                      <button
                        onClick={() => { addMember(u.id); setMemberSearch(""); setMemberResults([]); }}
                        disabled={addingMember === u.id}
                        className="shrink-0 rounded-lg bg-indigo-deep p-1.5 text-white hover:bg-indigo-press transition disabled:opacity-50"
                      >
                        {addingMember === u.id ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {memberSearch.trim().length >= 2 && !memberSearching && memberResults.length === 0 && (
                <p className="text-[10px] text-ink-400 text-center mt-2">No users found</p>
              )}
            </div>
          )}

          {members.length === 0 ? (
            <p className="text-xs text-ink-400 text-center py-3">No members</p>
          ) : (
            <div className="space-y-1.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-ink-50/50">
                  <Avatar name={m.userName} avatar={m.userAvatar} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ink-800 truncate">{m.userName ?? "Unknown"}</p>
                    <p className="text-[10px] text-ink-400 truncate">{m.userEmail}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${m.role === "lead" ? "bg-indigo-50 text-indigo-deep" : "bg-ink-100 text-ink-500"}`}>
                    {m.role}
                  </span>
                  {canManage && (
                    <button onClick={() => setRemoveMemberTarget(m)} className="text-ink-300 hover:text-red-500 transition"><Trash2 className="size-3" /></button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Join Requests Card (for managers) */}
        {canManage && pendingCount > 0 && (
          <div className="bg-white rounded-2xl border border-amber-100 p-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <h4 className="text-xs font-semibold text-ink-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Bell className="size-3.5 text-amber-500" /> Join Requests ({pendingCount})
            </h4>
            <div className="space-y-2">
              {joinRequests.map((jr) => (
                <div key={jr.id} className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar name={jr.userName} avatar={jr.userAvatar} size={24} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-800">{jr.userName}</p>
                      <p className="text-[10px] text-ink-400">{jr.userEmail}</p>
                    </div>
                  </div>
                  {jr.message && <p className="text-[11px] text-ink-500 mb-1.5 ml-8">&ldquo;{jr.message}&rdquo;</p>}
                  <div className="flex gap-1.5 ml-8">
                    <button
                      onClick={() => reviewRequest(jr.id, "approved")}
                      disabled={reviewingRequest === jr.id}
                      className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] text-white hover:bg-emerald-600 transition disabled:opacity-50"
                    >
                      {reviewingRequest === jr.id ? <Loader2 className="size-3 animate-spin" /> : "Approve"}
                    </button>
                    <button
                      onClick={() => reviewRequest(jr.id, "rejected")}
                      disabled={reviewingRequest === jr.id}
                      className="rounded-lg bg-ink-100 px-2.5 py-1 text-[10px] text-ink-600 hover:bg-ink-200 transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="-my-4 sm:-my-6 flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* Page header — outside the panel, matching other pages */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 py-4 sm:py-5 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-ink-800 flex items-center gap-2">
            <FolderKanban className="size-6 text-indigo-deep" />
            ProjectsHub
          </h1>
          <p className="mt-0.5 text-sm text-ink-500">Browse and join projects across the organization</p>
        </div>
        {canManage && (
          <Link
            href="/apps/projectshub/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-deep px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-press transition shadow-sm"
          >
            <Plus className="size-4" /> New Project
          </Link>
        )}
      </div>

      <div className="flex flex-1 min-h-0 bg-white overflow-hidden" style={{ borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        {/* Left Panel */}
        <div className={`w-full lg:w-[280px] xl:w-[300px] lg:shrink-0 border-r border-ink-100 ${
          mobileView === "list" ? "block" : "hidden lg:block"
        }`}>
          {leftPanel}
        </div>

        {/* Center Panel */}
        <div className={`flex-1 min-w-0 ${
          mobileView === "chat" ? "block" : "hidden lg:block"
        }`}>
          {centerPanel}
        </div>

        {/* Right Panel */}
        <div className={`w-full lg:w-[280px] xl:w-[300px] lg:shrink-0 border-l border-ink-100 bg-ink-50/30 ${
          mobileView === "info" ? "block" : "hidden lg:block"
        }`}>
          {rightPanel}
        </div>
      </div>

      {/* Delete channel confirmation */}
      <AlertDialog open={!!deleteChannelTarget} onOpenChange={(open) => { if (!open) setDeleteChannelTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete channel?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>#{deleteChannelTarget?.name}</strong> and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingChannel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChannel} disabled={deletingChannel} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
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
              Remove <strong>{removeMemberTarget?.userName ?? "this member"}</strong> from the project?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveMember} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete project confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{project?.name}</strong> and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingProject}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteProject} disabled={deletingProject} className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
              {deletingProject ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
