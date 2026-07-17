import { sql } from "./db";

export async function logActivity({
  userId,
  sourceApp,
  eventType,
  title,
  description,
  metadata,
}: {
  userId: string;
  sourceApp: "ideahub" | "skillshub" | "birthdayhub" | "engage";
  eventType: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  await sql`
    INSERT INTO engage.activity_feed (user_id, source_app, event_type, title, description, metadata)
    VALUES (${userId}, ${sourceApp}, ${eventType}, ${title}, ${description ?? null}, ${JSON.stringify(metadata ?? {})})
  `;
}
