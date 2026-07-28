"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowLeft, ThumbsUp, ThumbsDown, Bookmark, BookmarkCheck,
  Sparkles, MessageSquare, Loader2, Trash2,
} from "lucide-react";

type IdeaDetail = {
  id: string;
  title: string;
  description: string;
  categoryName: string | null;
  categoryIcon: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  isAnonymous: boolean;
  status: string;
  aiEnrichment: { tags?: string[]; improvedDescription?: string; impactReason?: string; feasibilityReason?: string } | null;
  impactScore: number | null;
  feasibilityScore: number | null;
  netVotes: number;
  commentCount: number;
  bookmarkCount: number;
  createdAt: string;
  isAuthor: boolean;
  isAdmin: boolean;
  userVote: string | null;
  isBookmarked: boolean;
};

type Comment = {
  id: string;
  body: string;
  authorName: string | null;
  authorAvatar: string | null;
  isAnonymous: boolean;
  parentId: string | null;
  reactions: Record<string, number>;
  createdAt: string;
  isOwn: boolean;
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  implemented: "bg-purple-50 text-purple-700 border-purple-200",
  declined: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  approved: "Approved",
  implemented: "Implemented",
  declined: "Declined",
};

const STATUSES = ["open", "under_review", "approved", "implemented", "declined"];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function IdeaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [commentAnon, setCommentAnon] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [postingComment, setPostingComment] = useState(false);
  const [voting, setVoting] = useState(false);

  const fetchIdea = useCallback(async () => {
    try {
      const res = await fetch(`/api/ideahub/ideas/${id}`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setIdea(data.idea);
    } catch { /* */ }
    setLoading(false);
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/ideahub/ideas/${id}/comments`);
      const data = await res.json();
      setComments(data.comments ?? []);
    } catch { /* */ }
  }, [id]);

  useEffect(() => { fetchIdea(); fetchComments(); }, [fetchIdea, fetchComments]);

  async function handleVote(voteType: "up" | "down") {
    if (voting || !idea) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/ideahub/ideas/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voteType }),
      });
      const data = await res.json();
      if (data.ok) {
        setIdea((prev) => prev ? { ...prev, netVotes: data.netVotes, userVote: data.userVote } : prev);
      }
    } catch { /* */ }
    setVoting(false);
  }

  async function handleBookmark() {
    if (!idea) return;
    try {
      const res = await fetch(`/api/ideahub/ideas/${id}/bookmark`, { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setIdea((prev) => prev ? { ...prev, isBookmarked: data.bookmarked } : prev);
      }
    } catch { /* */ }
  }

  async function handleStatusChange(status: string) {
    try {
      const res = await fetch(`/api/ideahub/ideas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) {
        setIdea((prev) => prev ? { ...prev, status } : prev);
        toast.success(`Status changed to ${STATUS_LABELS[status]}`);
      }
    } catch { /* */ }
  }

  async function handleDelete() {
    if (!confirm("Delete this idea? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/ideahub/ideas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        toast.success("Idea deleted.");
        router.push("/apps/ideahub");
      }
    } catch { /* */ }
  }

  async function handleComment() {
    if (!commentBody.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/ideahub/ideas/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: commentBody.trim(),
          isAnonymous: commentAnon,
          parentId: replyTo,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setCommentBody("");
        setReplyTo(null);
        fetchComments();
        setIdea((prev) => prev ? { ...prev, commentCount: prev.commentCount + 1 } : prev);
      }
    } catch { /* */ }
    setPostingComment(false);
  }

  async function handleDeleteComment(commentId: string) {
    try {
      const res = await fetch(`/api/ideahub/ideas/${id}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        fetchComments();
        setIdea((prev) => prev ? { ...prev, commentCount: Math.max(0, prev.commentCount - 1) } : prev);
      }
    } catch { /* */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading idea...</p>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="mx-auto max-w-3xl text-center py-24">
        <p className="text-lg font-medium">Idea not found</p>
        <Link href="/apps/ideahub" className="mt-2 text-sm text-indigo-deep hover:underline">
          Back to feed
        </Link>
      </div>
    );
  }

  const topLevel = comments.filter((c) => !c.parentId);
  const replies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back */}
      <Link
        href="/apps/ideahub"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="size-4" /> Back to feed
      </Link>

      {/* Main card */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${STATUS_COLORS[idea.status]}`}>
              {STATUS_LABELS[idea.status]}
            </span>
            {idea.categoryIcon && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs">
                {idea.categoryIcon} {idea.categoryName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmark}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition"
              title={idea.isBookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {idea.isBookmarked ? <BookmarkCheck className="size-4 text-indigo-deep" /> : <Bookmark className="size-4" />}
            </button>
            {(idea.isAuthor || idea.isAdmin) && (
              <button
                onClick={handleDelete}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition"
                title="Delete idea"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground">{idea.title}</h1>

        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {idea.description}
        </p>

        {/* Author + time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {idea.isAnonymous ? (
            <span>Anonymous</span>
          ) : (
            <div className="flex items-center gap-1.5">
              {idea.authorAvatar ? (
                <img src={idea.authorAvatar} alt="" className="size-5 rounded-full object-cover" />
              ) : null}
              <span>{idea.authorName}</span>
            </div>
          )}
          <span>·</span>
          <span>{timeAgo(idea.createdAt)}</span>
        </div>

        {/* Vote buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => handleVote("up")}
            disabled={voting}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              idea.userVote === "up"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "hover:bg-secondary"
            }`}
          >
            <ThumbsUp className="size-4" /> Upvote
          </button>
          <span className="text-lg font-bold text-foreground">{idea.netVotes}</span>
          <button
            onClick={() => handleVote("down")}
            disabled={voting}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              idea.userVote === "down"
                ? "border-red-300 bg-red-50 text-red-700"
                : "hover:bg-secondary"
            }`}
          >
            <ThumbsDown className="size-4" /> Downvote
          </button>
        </div>

        {/* Admin status change */}
        {idea.isAdmin && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-xs font-medium text-muted-foreground">Change status:</span>
            {STATUSES.filter((s) => s !== idea.status).map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase transition hover:opacity-80 ${STATUS_COLORS[s]}`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* AI enrichment card */}
      {idea.aiEnrichment && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-indigo-deep" />
            <h3 className="text-sm font-semibold">AI Insights</h3>
          </div>
          {idea.aiEnrichment.tags && (idea.aiEnrichment.tags as string[]).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(idea.aiEnrichment.tags as string[]).map((tag) => (
                <span key={tag} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {idea.impactScore && (
              <div className="rounded-lg bg-amber-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-800">Impact</span>
                  <span className="text-sm font-bold text-amber-700">{idea.impactScore}/10</span>
                </div>
                {idea.aiEnrichment.impactReason && (
                  <p className="mt-1 text-xs text-amber-600">{idea.aiEnrichment.impactReason as string}</p>
                )}
              </div>
            )}
            {idea.feasibilityScore && (
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-800">Feasibility</span>
                  <span className="text-sm font-bold text-blue-700">{idea.feasibilityScore}/10</span>
                </div>
                {idea.aiEnrichment.feasibilityReason && (
                  <p className="mt-1 text-xs text-blue-600">{idea.aiEnrichment.feasibilityReason as string}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Comments ({idea.commentCount})</h3>
        </div>

        {/* Comment form */}
        <div className="space-y-2">
          {replyTo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Replying to a comment</span>
              <button onClick={() => setReplyTo(null)} className="text-indigo-deep hover:underline">Cancel</button>
            </div>
          )}
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCommentAnon(!commentAnon)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  commentAnon ? "bg-indigo-deep" : "bg-muted"
                }`}
              >
                <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-lg transition-transform ${
                  commentAnon ? "translate-x-4" : "translate-x-0"
                }`} />
              </button>
              <span className="text-xs text-muted-foreground">Anonymous</span>
            </div>
            <button
              onClick={handleComment}
              disabled={postingComment || !commentBody.trim()}
              className="rounded-lg bg-indigo-deep px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-press transition disabled:opacity-50"
            >
              {postingComment ? "Posting..." : "Post"}
            </button>
          </div>
        </div>

        {/* Comment list */}
        {topLevel.length === 0 ? (
          <p className="text-xs text-muted-foreground">No comments yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {topLevel.map((c) => (
              <CommentNode
                key={c.id}
                comment={c}
                replies={replies(c.id)}
                onReply={(id) => { setReplyTo(id); }}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentNode({
  comment,
  replies,
  onReply,
  onDelete,
  depth = 0,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (id: string) => void;
  onDelete: (id: string) => void;
  depth?: number;
}) {
  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-muted pl-4" : ""}>
      <div className="flex items-start gap-2">
        {comment.isAnonymous ? (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
            🎭
          </div>
        ) : comment.authorAvatar ? (
          <img src={comment.authorAvatar} alt="" className="size-7 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">
            {(comment.authorName ?? "?")[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {comment.isAnonymous ? "Anonymous" : comment.authorName}
            </span>
            <span>{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm text-foreground">{comment.body}</p>
          <div className="mt-1.5 flex items-center gap-3">
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-muted-foreground hover:text-foreground transition"
            >
              Reply
            </button>
            {comment.isOwn && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-muted-foreground hover:text-red-600 transition"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
      {replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((r) => (
            <CommentNode key={r.id} comment={r} replies={[]} onReply={onReply} onDelete={onDelete} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
