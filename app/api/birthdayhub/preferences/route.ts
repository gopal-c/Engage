import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT hobbies, favorite_drinks, food_preference, interests,
           celebration_style, about_me, updated_at
    FROM birthdayhub.user_preferences
    WHERE user_id = ${session.user.id}
  `;

  return NextResponse.json({ preferences: rows[0] ?? null });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    hobbies = [],
    favorite_drinks = [],
    food_preference = null,
    interests = [],
    celebration_style = null,
    about_me = null,
  } = body;

  if (about_me && typeof about_me === "string" && about_me.length > 500) {
    return NextResponse.json({ error: "About me must be 500 characters or less" }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO birthdayhub.user_preferences (user_id, hobbies, favorite_drinks, food_preference, interests, celebration_style, about_me, updated_at)
    VALUES (
      ${session.user.id},
      ${hobbies as string[]},
      ${favorite_drinks as string[]},
      ${food_preference},
      ${interests as string[]},
      ${celebration_style},
      ${about_me ? (about_me as string).trim().slice(0, 500) : null},
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      hobbies = EXCLUDED.hobbies,
      favorite_drinks = EXCLUDED.favorite_drinks,
      food_preference = EXCLUDED.food_preference,
      interests = EXCLUDED.interests,
      celebration_style = EXCLUDED.celebration_style,
      about_me = EXCLUDED.about_me,
      updated_at = NOW()
    RETURNING hobbies, favorite_drinks, food_preference, interests, celebration_style, about_me, updated_at
  `;

  return NextResponse.json({ preferences: rows[0] });
}
