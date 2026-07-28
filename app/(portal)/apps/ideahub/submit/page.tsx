"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Loader2, AlertTriangle, Undo2 } from "lucide-react";
import Link from "next/link";

type Category = { id: string; name: string; icon: string | null };
type SimilarIdea = { id: string; title: string; similarity: string };
type AIEnrichment = { improvedDescription: string; tags: string[] };

export default function SubmitIdeaPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [originalDescription, setOriginalDescription] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [similarIdeas, setSimilarIdeas] = useState<SimilarIdea[]>([]);

  useEffect(() => {
    fetch("/api/ideahub/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  async function handleAIEnrich() {
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in title and description first.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/ideahub/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId || null,
          isAnonymous,
          enrich: true,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error ?? "AI enrichment failed.");
        return;
      }
      const enrichment: AIEnrichment | null = data.enrichment ?? null;
      if (enrichment?.improvedDescription) {
        setOriginalDescription(description);
        setDescription(enrichment.improvedDescription);
        setAiTags(enrichment.tags ?? []);
      }
      setSimilarIdeas(data.similar ?? []);
      toast.success("Description enhanced by AI.");
    } catch {
      toast.error("Network error — try again.");
    } finally {
      setAiLoading(false);
    }
  }

  function handleUndo() {
    if (originalDescription !== null) {
      setDescription(originalDescription);
      setOriginalDescription(null);
      setAiTags([]);
      toast.info("Reverted to your original description.");
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    const isEnriched = originalDescription !== null;
    try {
      const res = await fetch("/api/ideahub/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId || null,
          isAnonymous,
          submit: true,
          aiEnrichment: isEnriched ? {
            tags: aiTags,
            improvedDescription: description.trim(),
          } : null,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error ?? "Failed to submit idea.");
        return;
      }
      toast.success("Idea submitted!");
      router.push(`/apps/ideahub/${data.idea.id}`);
    } catch {
      toast.error("Network error — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/apps/ideahub"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submit an Idea</h1>
          <p className="text-sm text-muted-foreground">
            Share your innovation with the team
          </p>
        </div>
      </div>

      {similarIdeas.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Similar ideas found</p>
              <ul className="mt-2 space-y-1">
                {similarIdeas.map((s) => (
                  <li key={s.id} className="text-xs text-amber-700">
                    <Link href={`/apps/ideahub/${s.id}`} className="underline hover:no-underline">
                      {s.title}
                    </Link>
                    {" — "}{s.similarity}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <div>
          <label htmlFor="idea-cat" className="mb-1.5 block text-sm font-medium">
            Category
          </label>
          <select
            id="idea-cat"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary outline-none"
          >
            <option value="">Select a category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="idea-title" className="mb-1.5 block text-sm font-medium">
            Title
          </label>
          <input
            id="idea-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A concise title for your idea..."
            maxLength={200}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="idea-desc" className="block text-sm font-medium">
              Description
            </label>
            {originalDescription !== null && (
              <button
                onClick={handleUndo}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
              >
                <Undo2 className="size-3" />
                Undo AI changes
              </button>
            )}
          </div>
          <textarea
            id="idea-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your idea in detail — what problem does it solve? How would it work?"
            rows={6}
            maxLength={5000}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition resize-none"
          />
          <div className="mt-1 flex items-center justify-between">
            {aiTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {aiTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span />
            )}
            <p className="text-xs text-muted-foreground">
              {description.length}/5000
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              isAnonymous ? "bg-indigo-deep" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-lg transition-transform ${
                isAnonymous ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className="text-sm text-foreground">
            Post anonymously
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleAIEnrich}
            disabled={aiLoading || !title.trim() || !description.trim()}
            className="ai-gradient-btn inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-indigo-deep transition-all disabled:opacity-50"
          >
            {aiLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {aiLoading ? "AI is thinking..." : "Enrich with AI"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !description.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-deep px-5 py-2.5 text-sm font-medium text-white shadow-2 transition-all hover:bg-indigo-press hover:shadow-3 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .ai-gradient-btn {
          border: 2px solid transparent;
          background-image: linear-gradient(white, white), linear-gradient(135deg, #8B7BE8, #7CD3C5, #FFCB6B, #FF9A82);
          background-origin: border-box;
          background-clip: padding-box, border-box;
          box-shadow: 0 2px 8px rgba(139, 123, 232, 0.2), 0 1px 3px rgba(124, 211, 197, 0.15);
        }
        .ai-gradient-btn:hover:not(:disabled) {
          box-shadow: 0 4px 14px rgba(139, 123, 232, 0.3), 0 2px 6px rgba(124, 211, 197, 0.2);
        }
      `}</style>
    </div>
  );
}
