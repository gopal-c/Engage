import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [birthdayRows, anniversaryRows] = await Promise.all([
      sql`
        SELECT DISTINCT ON (lower(combined.email))
          combined.name, combined.avatar_url, combined.user_id,
          to_char(combined.date_of_birth, 'MM-DD') AS birthday_mmdd
        FROM (
          SELECT p.name, p.email, p.avatar_url, p.user_id,
                 COALESCE(u.date_of_birth, p.date_of_birth) AS date_of_birth
          FROM skillshub.profiles p
          LEFT JOIN auth.users u ON lower(u.email) = lower(p.email)
          WHERE p.status = 'approved' AND COALESCE(u.date_of_birth, p.date_of_birth) IS NOT NULL
          UNION ALL
          SELECT u.name, u.email, u.avatar_url, u.id AS user_id,
                 u.date_of_birth
          FROM auth.users u
          WHERE u.date_of_birth IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM skillshub.profiles p WHERE lower(p.email) = lower(u.email) AND p.status = 'approved')
        ) combined
        LEFT JOIN birthdayhub.excluded_users ex ON ex.user_id = combined.user_id
        WHERE ex.user_id IS NULL
          AND to_char(combined.date_of_birth, 'MM-DD') >= to_char(NOW(), 'MM-DD')
          AND to_char(combined.date_of_birth, 'MM-DD') <= to_char(NOW() + INTERVAL '7 days', 'MM-DD')
        ORDER BY lower(combined.email), to_char(combined.date_of_birth, 'MM-DD') ASC
        LIMIT 5
      `,
      sql`
        SELECT p.name, p.avatar_url,
          EXTRACT(YEAR FROM age(NOW(), p.joining_date))::int AS years
        FROM skillshub.profiles p
        WHERE p.status = 'approved' AND p.joining_date IS NOT NULL
          AND to_char(p.joining_date, 'MM-DD') >= to_char(NOW(), 'MM-DD')
          AND to_char(p.joining_date, 'MM-DD') <= to_char(NOW() + INTERVAL '7 days', 'MM-DD')
          AND EXTRACT(YEAR FROM age(NOW(), p.joining_date)) >= 1
        ORDER BY to_char(p.joining_date, 'MM-DD') ASC
        LIMIT 5
      `,
    ]);

    return NextResponse.json({
      birthdays: birthdayRows,
      anniversaries: anniversaryRows,
    });
  } catch (err) {
    console.error("This-week API error:", err);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
