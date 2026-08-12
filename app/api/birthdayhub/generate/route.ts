import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { sql } from "@/lib/db";

let _groq: Groq | null = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

async function getUserPreferences(name: string, email?: string) {
  try {
    let rows;
    if (email) {
      rows = await sql`
        SELECT p.hobbies, p.favorite_drinks, p.food_preference, p.interests,
               p.celebration_style, p.about_me
        FROM birthdayhub.user_preferences p
        JOIN auth.users u ON u.id = p.user_id
        WHERE lower(u.email) = lower(${email})
      `;
    }
    if (!rows || rows.length === 0) {
      rows = await sql`
        SELECT p.hobbies, p.favorite_drinks, p.food_preference, p.interests,
               p.celebration_style, p.about_me
        FROM birthdayhub.user_preferences p
        JOIN auth.users u ON u.id = p.user_id
        WHERE lower(u.name) = lower(${name})
      `;
    }
    if (rows.length === 0) return null;
    return rows[0] as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildPreferenceContext(prefs: Record<string, unknown>): string {
  const parts: string[] = [];
  const hobbies = prefs.hobbies as string[] | null;
  const drinks = prefs.favorite_drinks as string[] | null;
  const food = prefs.food_preference as string | null;
  const interests = prefs.interests as string[] | null;
  const style = prefs.celebration_style as string | null;
  const aboutMe = prefs.about_me as string | null;

  if (hobbies && hobbies.length > 0) parts.push(`Hobbies: ${hobbies.join(", ")}`);
  if (drinks && drinks.length > 0) parts.push(`Favorite drinks: ${drinks.join(", ")}`);
  if (food) parts.push(`Food preference: ${food}`);
  if (interests && interests.length > 0) parts.push(`Interests: ${interests.join(", ")}`);
  if (style) parts.push(`Celebration style: ${style}`);
  if (aboutMe) parts.push(`About them: ${aboutMe}`);

  return parts.length > 0
    ? `\nPersonal preferences for ${prefs._name ?? "this person"}: ${parts.join(". ")}.`
    : "";
}

export async function POST(req: Request) {
  const { name, notes, email } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const prefs = await getUserPreferences(name, email);
  const prefsContext = prefs ? buildPreferenceContext({ ...prefs, _name: name }) : "";
  const extraContext = [
    notes ? `\nExtra context about this person: ${notes}` : "",
    prefsContext,
  ].filter(Boolean).join("");

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
- fuel: 1-2 words max, fun and specific${prefs ? "\n- Use the person's known preferences to make the message and fuel genuinely personal" : ""}
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
