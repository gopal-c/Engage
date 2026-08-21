import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { createFeedEvent } from "@/lib/feed";
import { awardXP } from "@/lib/xp";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    date_of_birth,
    hobbies = [],
    favorite_drinks = [],
    food_preference = null,
    interests = [],
    celebration_style = null,
    skip,
  } = body;

  if (skip) {
    await sql`
      INSERT INTO birthdayhub.about_me (user_id, updated_at)
      VALUES (${session.user.id}, NOW())
      ON CONFLICT (user_id) DO NOTHING
    `;
    return NextResponse.json({ ok: true });
  }

  if (!date_of_birth) {
    return NextResponse.json({ error: "Date of birth is required" }, { status: 400 });
  }

  await sql`
    UPDATE auth.users
    SET date_of_birth = ${date_of_birth}, updated_at = NOW()
    WHERE id = ${session.user.id}
  `;

  await sql`
    INSERT INTO birthdayhub.about_me (user_id, hobbies, favorite_drinks, food_preference, interests, celebration_style, updated_at)
    VALUES (
      ${session.user.id},
      ${hobbies as string[]},
      ${favorite_drinks as string[]},
      ${food_preference},
      ${interests as string[]},
      ${celebration_style},
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      hobbies = EXCLUDED.hobbies,
      favorite_drinks = EXCLUDED.favorite_drinks,
      food_preference = EXCLUDED.food_preference,
      interests = EXCLUDED.interests,
      celebration_style = EXCLUDED.celebration_style,
      updated_at = NOW()
  `;

  createFeedEvent({
    eventType: "new_joiner",
    sourceApp: "engage",
    userId: session.user.id,
    title: `${session.user.name ?? "Someone"} just joined Engage!`,
    description: "Welcome them to the team",
    metadata: { sayHello: "Drop a comment to say hi!" },
  }).catch(() => {});

  awardXP(session.user.id, "engage", "onboarding_completed").catch(() => {});

  return NextResponse.json({ ok: true });
}
