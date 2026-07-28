"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

type Category = { id: string; name: string; icon: string | null };
type SimilarIdea = { id: string; title: string; similarity: string };
type AIResult = {
  enrichment: { improvedDescription: string; tags: string[] } | null;
  scores: { impactScore: number; feasibilityScore: number; impactReason: string; feasibilityReason: string } | null;
  similar: SimilarIdea[];
};

export default function SubmitIdeaPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      setAiResult({
        enrichment: data.enrichment ?? null,
        scores: data.scores ?? null,
        similar: data.similar ?? [],
      });
      toast.success("AI enrichment complete — review below.");
    } catch {
      toast.error("Network error — try again.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit() {
    const useAI = !!aiResult;
    setSubmitting(true);
    try {
      const res = await fetch("/api/ideahub/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: useAI && aiResult?.enrichment
            ? aiResult.enrichment.improvedDescription
            : description.trim(),
          categoryId: categoryId || null,
          isAnonymous,
          submit: true,
          aiEnrichment: useAI && aiResult ? {
            tags: aiResult.enrichment?.tags ?? [],
            improvedDescription: aiResult.enrichment?.improvedDescription,
            impactReason: aiResult.scores?.impactReason,
            feasibilityReason: aiResult.scores?.feasibilityReason,
          } : null,
          impactScore: useAI ? aiResult?.scores?.impactScore : null,
          feasibilityScore: useAI ? aiResult?.scores?.feasibilityScore : null,
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

      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
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
          <label htmlFor="idea-desc" className="mb-1.5 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="idea-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your idea in detail — what problem does it solve? How would it work?"
            rows={6}
            maxLength={5000}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-ring outline-none transition resize-none"
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {description.length}/5000
          </p>
        </div>

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
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-2 transition-all hover:shadow-3 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)" }}
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

      {aiResult && (
        <div className="space-y-4">
          {aiResult.similar.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Similar ideas found</p>
                  <ul className="mt-2 space-y-1">
                    {aiResult.similar.map((s) => (
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

          {aiResult.enrichment && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="size-4 text-indigo-deep" />
                <h3 className="text-sm font-semibold">AI-Enhanced Description</h3>
              </div>
              <div className="rounded-lg bg-secondary p-4 text-sm whitespace-pre-wrap">
                {aiResult.enrichment.improvedDescription}
              </div>
              {aiResult.enrichment.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {aiResult.enrichment.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {aiResult.scores && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4">AI Assessment</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-amber-50 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-amber-800">Impact</span>
                    <span className="text-lg font-bold text-amber-700">{aiResult.scores.impactScore}/10</span>
                  </div>
                  <p className="text-xs text-amber-600">{aiResult.scores.impactReason}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-800">Feasibility</span>
                    <span className="text-lg font-bold text-blue-700">{aiResult.scores.feasibilityScore}/10</span>
                  </div>
                  <p className="text-xs text-blue-600">{aiResult.scores.feasibilityReason}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
