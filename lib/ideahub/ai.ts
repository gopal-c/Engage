import { getGroqClient, GROQ_MODEL } from "@/lib/groq";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EnrichmentResult = {
  improvedDescription: string;
  tags: string[];
};

export type ScoreResult = {
  impactScore: number;
  feasibilityScore: number;
  impactReason: string;
  feasibilityReason: string;
};

export type SimilarIdea = {
  id: string;
  title: string;
  similarity: string;
};

// ---------------------------------------------------------------------------
// Groq client
// ---------------------------------------------------------------------------

const getGroq = getGroqClient;
const MODEL = GROQ_MODEL;
const TEMPERATURE = 0.3;

// ---------------------------------------------------------------------------
// 1. enrichIdea
// ---------------------------------------------------------------------------

export async function enrichIdea(
  title: string,
  description: string,
): Promise<EnrichmentResult> {
  try {
    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an innovation assistant. Given an idea title and description, " +
            "rewrite the description to be clearer and more compelling while keeping " +
            "the original intent. Also suggest 3-5 relevant tags.\n\n" +
            "Respond with JSON: { \"improvedDescription\": string, \"tags\": string[] }",
        },
        {
          role: "user",
          content: `Title: ${title}\n\nDescription: ${description}`,
        },
      ],
    });

    const parsed = JSON.parse(
      completion.choices[0]?.message?.content ?? "{}",
    );

    return {
      improvedDescription:
        typeof parsed.improvedDescription === "string"
          ? parsed.improvedDescription
          : description,
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t: unknown) => typeof t === "string")
        : [],
    };
  } catch {
    return { improvedDescription: description, tags: [] };
  }
}

// ---------------------------------------------------------------------------
// 2. scoreIdea
// ---------------------------------------------------------------------------

export async function scoreIdea(
  title: string,
  description: string,
): Promise<ScoreResult> {
  try {
    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an innovation evaluator. Rate the following idea on two dimensions:\n" +
            "- Impact (1-10): how much value would this idea bring to the organization?\n" +
            "- Feasibility (1-10): how realistic is implementation?\n\n" +
            "Provide brief reasoning for each score.\n\n" +
            "Respond with JSON: { \"impactScore\": number, \"feasibilityScore\": number, " +
            '"impactReason": string, "feasibilityReason": string }',
        },
        {
          role: "user",
          content: `Title: ${title}\n\nDescription: ${description}`,
        },
      ],
    });

    const parsed = JSON.parse(
      completion.choices[0]?.message?.content ?? "{}",
    );

    const clamp = (v: unknown) => {
      const n = Number(v);
      if (Number.isNaN(n)) return 5;
      return Math.max(1, Math.min(10, Math.round(n)));
    };

    return {
      impactScore: clamp(parsed.impactScore),
      feasibilityScore: clamp(parsed.feasibilityScore),
      impactReason:
        typeof parsed.impactReason === "string" ? parsed.impactReason : "",
      feasibilityReason:
        typeof parsed.feasibilityReason === "string"
          ? parsed.feasibilityReason
          : "",
    };
  } catch {
    return {
      impactScore: 5,
      feasibilityScore: 5,
      impactReason: "",
      feasibilityReason: "",
    };
  }
}

// ---------------------------------------------------------------------------
// 3. findSimilarIdeas
// ---------------------------------------------------------------------------

export async function findSimilarIdeas(
  title: string,
  description: string,
  existingIdeas: { id: string; title: string; description: string }[],
): Promise<{ similar: SimilarIdea[] }> {
  if (existingIdeas.length === 0) return { similar: [] };

  try {
    const groq = getGroq();

    const existingList = existingIdeas
      .map((idea) => `[${idea.id}] ${idea.title}: ${idea.description}`)
      .join("\n");

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: TEMPERATURE,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a duplicate-detection assistant. Given a new idea and a list of " +
            "existing ideas, identify which existing ideas are similar to the new one. " +
            "Only include genuinely similar ideas, not vaguely related ones.\n\n" +
            'Respond with JSON: { "similar": [{ "id": string, "title": string, "similarity": string }] }\n' +
            "where similarity is a brief explanation of why the ideas are similar. " +
            "Return an empty array if none are similar.",
        },
        {
          role: "user",
          content:
            `New idea:\nTitle: ${title}\nDescription: ${description}\n\n` +
            `Existing ideas:\n${existingList}`,
        },
      ],
    });

    const parsed = JSON.parse(
      completion.choices[0]?.message?.content ?? "{}",
    );

    if (!Array.isArray(parsed.similar)) return { similar: [] };

    const similar: SimilarIdea[] = parsed.similar
      .filter(
        (s: Record<string, unknown>) =>
          typeof s.id === "string" &&
          typeof s.title === "string" &&
          typeof s.similarity === "string",
      )
      .map((s: Record<string, unknown>) => ({
        id: s.id as string,
        title: s.title as string,
        similarity: s.similarity as string,
      }));

    return { similar };
  } catch {
    return { similar: [] };
  }
}
