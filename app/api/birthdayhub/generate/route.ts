import { NextResponse } from "next/server";
import Groq from "groq-sdk";

let _groq: Groq | null = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

export async function POST(req: Request) {
  const { name, notes } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const extraContext = notes ? `\nExtra context about this person: ${notes}` : "";

  try {
    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Write a birthday message for ${name}.${extraContext}

Return ONLY a valid JSON object with no extra text or markdown, exactly like this:
{
  "message": "Dear ${name}, [exactly 1 warm, personal, heartfelt birthday sentence — not generic]",
  "mood": "[one upbeat word that fits ${name}'s vibe today, e.g. Radiant, Creative, Stellar, Focused, Bright]",
  "fuel": "[what ${name} probably runs on — a drink or snack, 1-2 words, e.g. Espresso, Cold Brew, Matcha, Green Tea, Pizza]"
}

Rules:
- message: exactly 1 sentence starting with "Dear ${name},"
- message: use "we" / "our" throughout — this is a company-wide message, never "I" or "my"
- mood: single capitalised word, energetic and positive
- fuel: 1-2 words max, fun and specific
- Do NOT use hollow phrases like "on this special day"
- Sound warm and genuine, from the whole team`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let message = "";
    let mood = "Sunny";
    let fuel = "Coffee";

    try {
      const parsed = JSON.parse(cleaned);
      message = parsed.message ?? "";
      mood = parsed.mood ?? "Sunny";
      fuel = parsed.fuel ?? "Coffee";
    } catch {
      message = raw;
    }

    return NextResponse.json({ message, mood, fuel });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Failed to generate message", detail: String(err) }, { status: 500 });
  }
}
