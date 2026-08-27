"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, MessageCircle, PartyPopper, Send, PenLine } from "lucide-react";

/* --- Types --- */

export type FeedEvent = {
  id: string;
  event_type: string;
  source_app: string;
  user_id: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  pinned: boolean;
  event_date: string;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
  user_email: string;
  like_count: number;
  celebrate_count: number;
  comment_count: number;
  my_reactions: string[];
  comments: FeedComment[];
  groupCard: GroupCard | null;
  ideaData: IdeaData | null;
};

type FeedComment = {
  id: string;
  body: string;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
};

type GroupCard = {
  id: string;
  status: string;
  closes_at: string;
  signature_count: number;
  signatures: { message: string; created_at: string; user_name: string; user_avatar: string | null }[];
};

type IdeaData = {
  id: string;
  is_anonymous: boolean;
  up_votes: number;
  down_votes: number;
  idea_comment_count: number;
  my_vote: "up" | "down" | null;
};

/* --- Badge configs --- */

const EVENT_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  new_joiner: { label: "NEW JOINER", color: "#16a34a", bg: "#dcfce7" },
  birthday_today: { label: "BIRTHDAY TODAY", color: "#ea580c", bg: "#fff7ed" },
  birthday_upcoming: { label: "BIRTHDAY", color: "#d97706", bg: "#fffbeb" },
  idea_shared: { label: "IDEA", color: "#7c3aed", bg: "#f5f3ff" },
  certification: { label: "CERTIFICATION", color: "#0891b2", bg: "#ecfeff" },
  work_anniversary: { label: "ANNIVERSARY", color: "#0d9488", bg: "#f0fdfa" },
  milestone: { label: "MILESTONE", color: "#2563eb", bg: "#eff6ff" },
  achievement: { label: "ACHIEVEMENT", color: "#ca8a04", bg: "#fefce8" },
};

const EVENT_EMOJI: Record<string, string> = {
  new_joiner: "\u{1F44B}",
  birthday_today: "\u{1F382}",
  birthday_upcoming: "\u{1F382}",
  idea_shared: "\u{1F4A1}",
  certification: "\u{1F4DC}",
  work_anniversary: "\u{1F389}",
  milestone: "\u{1F3D4}️",
  achievement: "\u{1F3C6}",
};

/* --- Avatar helper --- */

const AVATAR_COLORS = ["#8B7BE8", "#FF9A82", "#7CD3C5", "#FFCB6B", "#6B58D9", "#E87760", "#5BBFB0", "#E8A943"];

function nameToColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function UserAvatar({ name, avatar, size = 40 }: { name: string; avatar: string | null; size?: number }) {
  if (avatar) {
    return <img src={avatar} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const bg = nameToColor(name);
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  );
}

/* --- Time helpers --- */

function timeAgo(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

const CARD_STYLE = { borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" };

/* --- Main FeedCard --- */

export default function FeedCard({
  event,
  currentUserId,
  onRefresh,
}: {
  event: FeedEvent;
  currentUserId: string;
  onRefresh?: () => void;
}) {
  const [likeCount, setLikeCount] = useState(event.like_count);
  const [celebrateCount, setCelebrateCount] = useState(event.celebrate_count);
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set(event.my_reactions));
  const [commentCount, setCommentCount] = useState(event.comment_count);
  const [comments, setComments] = useState(event.comments);
  const [showAllComments, setShowAllComments] = useState(false);
  const [allComments, setAllComments] = useState<FeedComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [signText, setSignText] = useState("");
  const [signing, setSigning] = useState(false);

  const badge = EVENT_BADGES[event.event_type];
  const emoji = EVENT_EMOJI[event.event_type];
  const meta = event.metadata;
  const isAnonymous = event.ideaData?.is_anonymous && event.user_id !== currentUserId;
  const isBirthday = event.event_type === "birthday_today" || event.event_type === "birthday_upcoming";

  async function handleReaction(type: "like" | "celebrate") {
    try {
      const res = await fetch(`/api/feed/${event.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: type }),
      });
      const data = await res.json();
      if (data.ok) {
        const newReactions = new Set(myReactions);
        if (data.added) {
          newReactions.add(type);
          if (type === "like") setLikeCount((c) => c + 1);
          else setCelebrateCount((c) => c + 1);
        } else {
          newReactions.delete(type);
          if (type === "like") setLikeCount((c) => c - 1);
          else setCelebrateCount((c) => c - 1);
        }
        setMyReactions(newReactions);
      }
    } catch { toast.error("Failed to react"); }
  }

  async function handleComment() {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/feed/${event.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText("");
        setCommentCount((c) => c + 1);
        const commentsRes = await fetch(`/api/feed/${event.id}/comments`);
        const commentsData = await commentsRes.json();
        setAllComments(commentsData.comments ?? []);
        setComments((commentsData.comments ?? []).slice(-2));
        setShowAllComments(true);
      }
    } catch { toast.error("Failed to post comment"); }
    setSubmittingComment(false);
  }

  async function loadAllComments() {
    setShowAllComments(true);
    try {
      const res = await fetch(`/api/feed/${event.id}/comments`);
      const data = await res.json();
      setAllComments(data.comments ?? []);
    } catch { /* */ }
  }

  async function handleSign() {
    if (!signText.trim() || !event.groupCard) return;
    setSigning(true);
    try {
      const res = await fetch(`/api/birthdayhub/group-cards/${event.groupCard.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: signText.trim() }),
      });
      if (res.ok) {
        toast.success("Card signed!");
        setSignText("");
        onRefresh?.();
      }
    } catch { toast.error("Failed to sign card"); }
    setSigning(false);
  }

  const displayName = isAnonymous ? "Anonymous" : event.user_name;
  const displayAvatar = isAnonymous ? null : event.user_avatar;
  const displayComments = showAllComments ? allComments : comments;

  return (
    <div className="bg-white overflow-hidden" style={CARD_STYLE}>
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex items-start gap-3">
          <UserAvatar name={displayName} avatar={displayAvatar} size={44} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-ink-800">{displayName}</span>
              {!isAnonymous && (meta?.department as string) && (
                <span className="text-xs text-ink-400">{meta.department as string}</span>
              )}
              <span className="text-xs text-ink-400">· {["birthday_today", "birthday_upcoming", "new_joiner"].includes(event.event_type) ? dayLabel(event.event_date) : timeAgo(event.created_at)}</span>
            </div>
            {event.event_type === "idea_shared" && (
              <span className="text-xs text-ink-400">Shared to IdeaHub · {timeAgo(event.created_at)}</span>
            )}
          </div>
          {badge && (
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
              style={{ color: badge.color, backgroundColor: badge.bg }}
            >
              {emoji} {badge.label}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-3">
        <h3 className="text-[15px] font-semibold text-ink-800 mt-1">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-ink-500 mt-1 leading-relaxed">{event.description}</p>
        )}

        {event.event_type === "new_joiner" && (meta?.sayHello as string) && (
          <div className="mt-3 rounded-xl bg-ink-50 px-4 py-3">
            <p className="text-xs font-semibold text-ink-700">Say hello</p>
            <p className="text-xs text-ink-500 mt-0.5">{meta.sayHello as string}</p>
          </div>
        )}

        {(event.event_type === "birthday_today" || event.event_type === "birthday_upcoming") && (
          <BirthdayCardSection
            event={event}
            signText={signText}
            setSignText={setSignText}
            signing={signing}
            handleSign={handleSign}
          />
        )}

        {event.event_type === "idea_shared" && event.ideaData && (
          <IdeaSection event={event} currentUserId={currentUserId} />
        )}

        {(event.event_type === "certification" || event.event_type === "milestone") && (meta?.xpAwarded as number) && (
          <div className="mt-3 rounded-xl bg-[rgba(139,123,232,0.06)] px-4 py-3">
            <p className="text-xs font-medium text-[#6B58D9]">
              {meta.certName as string ?? event.title} · Added to SkillsHub · +{meta.xpAwarded as number} XP
            </p>
          </div>
        )}
      </div>

      {/* Reaction counts */}
      {(likeCount > 0 || celebrateCount > 0 || commentCount > 0) && (
        <div className="px-5 pb-2 flex items-center gap-4 text-xs text-ink-400">
          {likeCount > 0 && <span className="flex items-center gap-1">{"\u{1F44D}"} {likeCount}</span>}
          {celebrateCount > 0 && <span className="flex items-center gap-1">{"\u{1F389}"} {celebrateCount}</span>}
          {commentCount > 0 && <span className="ml-auto">{commentCount} comment{commentCount !== 1 ? "s" : ""}</span>}
        </div>
      )}

      {/* Action buttons */}
      <div className="mx-5 border-t border-ink-100 py-1.5 flex items-center gap-1">
        {event.event_type === "idea_shared" && event.ideaData ? (
          <IdeaActions event={event} currentUserId={currentUserId} />
        ) : isBirthday ? (
          <>
            <ActionButton
              icon={<PartyPopper className="size-4" />}
              label="Celebrate"
              active={myReactions.has("celebrate")}
              onClick={() => handleReaction("celebrate")}
            />
            {event.groupCard?.status === "open" && (
              <ActionButton
                icon={<PenLine className="size-4" />}
                label="Sign the card"
                onClick={() => {
                  const el = document.getElementById(`sign-input-${event.id}`);
                  el?.focus();
                }}
              />
            )}
          </>
        ) : (
          <>
            <ActionButton
              icon={<ThumbsUp className="size-4" />}
              label="Like"
              active={myReactions.has("like")}
              onClick={() => handleReaction("like")}
            />
            <ActionButton
              icon={<PartyPopper className="size-4" />}
              label="Celebrate"
              active={myReactions.has("celebrate")}
              onClick={() => handleReaction("celebrate")}
            />
          </>
        )}
        <ActionButton
          icon={<MessageCircle className="size-4" />}
          label="Comment"
          onClick={() => {
            const el = document.getElementById(`comment-input-${event.id}`);
            el?.focus();
          }}
        />
      </div>

      {/* Comments section */}
      <div className="mx-5 border-t border-ink-100 py-4 space-y-3">
        {commentCount > 2 && !showAllComments && (
          <button onClick={loadAllComments} className="text-xs font-medium text-ink-400 hover:text-ink-700 transition">
            View all {commentCount} comments
          </button>
        )}

        {displayComments.map((c) => (
          <div key={c.id} className="flex items-start gap-2.5">
            <UserAvatar name={c.user_name} avatar={c.user_avatar} size={28} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-ink-700">{c.user_name}</span>
              <p className="text-xs text-ink-600 mt-0.5">{c.body}</p>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-2">
          <UserAvatar name="You" avatar={null} size={28} />
          <div className="flex-1 flex items-center gap-2 rounded-full bg-ink-100/70 px-3 py-1.5">
            <input
              id={`comment-input-${event.id}`}
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-ink-400"
            />
            <button
              onClick={handleComment}
              disabled={submittingComment || !commentText.trim()}
              className="text-[#6B58D9] disabled:opacity-30 hover:text-[#5947C9] transition"
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --- Sub-components --- */

function ActionButton({ icon, label, active, count, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; count?: number; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition ${
        active
          ? "text-[#6B58D9] bg-[rgba(139,123,232,0.08)]"
          : "text-ink-500 hover:bg-ink-100/60"
      }`}
    >
      {icon}
      {label}{count != null ? ` ${count}` : ""}
    </button>
  );
}

function BirthdayCardSection({ event, signText, setSignText, signing, handleSign }: {
  event: FeedEvent; signText: string; setSignText: (v: string) => void; signing: boolean; handleSign: () => void;
}) {
  const gc = event.groupCard;
  const meta = event.metadata;

  return (
    <div className="mt-3 space-y-3">
      {(meta?.celebrationNote as string) && (
        <div className="rounded-xl bg-[#FFF4DE] px-4 py-3">
          <p className="text-xs font-semibold text-ink-700">{meta.celebrationNote as string}</p>
          {(meta?.celebrationDetails as string) && (
            <p className="text-xs text-ink-500 mt-0.5">{meta.celebrationDetails as string}</p>
          )}
        </div>
      )}

      {gc && (
        <div className="rounded-xl bg-ink-50 px-4 py-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">{"\u{1F4CB}"}</span>
            <div>
              <p className="text-xs font-semibold text-ink-700">
                Group card is {gc.status}
              </p>
              <p className="text-xs text-ink-400">
                {gc.signature_count} colleague{gc.signature_count !== 1 ? "s have" : " has"} signed so far
              </p>
            </div>
          </div>

          {gc.signature_count > 0 && (
            <div className="space-y-2 pl-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                {gc.signature_count} signature{gc.signature_count !== 1 ? "s" : ""} on the card
              </p>
              {gc.signatures.map((sig, i) => (
                <div key={i} className="flex items-start gap-2">
                  <UserAvatar name={sig.user_name} avatar={sig.user_avatar} size={24} />
                  <div>
                    <span className="text-xs font-semibold text-ink-700">{sig.user_name}</span>
                    <p className="text-xs italic text-ink-500" style={{ fontFamily: "'Instrument Serif', serif" }}>
                      {sig.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {gc.status === "open" && (
            <div className="flex items-center gap-2">
              <UserAvatar name="You" avatar={null} size={28} />
              <div className="flex-1 flex items-center gap-2 rounded-full bg-white px-3 py-1.5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <input
                  id={`sign-input-${event.id}`}
                  type="text"
                  placeholder="Add your message to the card..."
                  value={signText}
                  onChange={(e) => setSignText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSign(); } }}
                  className="flex-1 bg-transparent text-xs outline-none placeholder:text-ink-400"
                />
                <button
                  onClick={handleSign}
                  disabled={signing || !signText.trim()}
                  className="rounded-full bg-[#5BBFB0] px-3 py-1 text-[10px] font-bold text-white hover:bg-[#7CD3C5] transition disabled:opacity-40"
                >
                  Sign
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IdeaSection({ event, currentUserId }: { event: FeedEvent; currentUserId: string }) {
  const idea = event.ideaData;
  if (!idea) return null;
  const netVotes = idea.up_votes - idea.down_votes;

  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs text-ink-400 flex items-center gap-3">
        <span className="flex items-center gap-1"><ThumbsUp className="size-3" /> {netVotes} net votes</span>
        <span>· {idea.idea_comment_count} comment{idea.idea_comment_count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

function IdeaActions({ event }: { event: FeedEvent; currentUserId: string }) {
  const idea = event.ideaData;
  if (!idea) return null;

  const [myVote, setMyVote] = useState<"up" | "down" | null>(idea.my_vote);
  const [upVotes, setUpVotes] = useState(idea.up_votes);
  const [downVotes, setDownVotes] = useState(idea.down_votes);

  async function vote(type: "up" | "down") {
    try {
      const res = await fetch(`/api/ideahub/ideas/${idea.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType: type }),
      });
      const data = await res.json();
      if (data.ok) {
        const wasActive = myVote === type;
        setMyVote(data.userVote);
        if (type === "up") {
          if (wasActive) {
            setUpVotes((c) => c - 1);
            toast.success("Upvote removed");
          } else {
            setUpVotes((c) => c + 1);
            if (myVote === "down") setDownVotes((c) => c - 1);
            toast.success("Upvoted!");
          }
        } else {
          if (wasActive) {
            setDownVotes((c) => c - 1);
            toast.success("Downvote removed");
          } else {
            setDownVotes((c) => c + 1);
            if (myVote === "up") setUpVotes((c) => c - 1);
            toast.success("Downvoted");
          }
        }
      }
    } catch { toast.error("Failed to vote"); }
  }

  return (
    <>
      <ActionButton
        icon={<ThumbsUp className="size-4" />}
        label="Upvote"
        active={myVote === "up"}
        onClick={() => vote("up")}
      />
      <ActionButton
        icon={<ThumbsDown className="size-4" />}
        label="Downvote"
        active={myVote === "down"}
        onClick={() => vote("down")}
      />
    </>
  );
}

export { UserAvatar };
