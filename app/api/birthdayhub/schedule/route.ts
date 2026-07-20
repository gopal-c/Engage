import { NextResponse } from "next/server";
import { createScheduledSend, getScheduledSends } from "@/lib/birthdayhub/storage";
import { randomUUID } from "crypto";
import type { ScheduledSend } from "@/lib/birthdayhub/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const jobs = await getScheduledSends("pending");
  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const {
    employeeId, employeeName, employeeEmail, message,
    gmailUser, gmailAppPassword, fromName,
    cc, ccBehavior, mood, fuel, heroImageUrl, paletteId, scheduledAt,
  } = await req.json();

  if (!employeeId || !message || !scheduledAt) {
    return NextResponse.json(
      { error: "employeeId, message, and scheduledAt are required" },
      { status: 400 }
    );
  }

  if (!gmailUser || !gmailAppPassword) {
    return NextResponse.json(
      { error: "Gmail credentials are required for scheduled sends" },
      { status: 400 }
    );
  }

  const scheduled = new Date(scheduledAt);
  if (isNaN(scheduled.getTime()) || scheduled <= new Date()) {
    return NextResponse.json(
      { error: "scheduledAt must be a valid future datetime" },
      { status: 400 }
    );
  }

  const job: ScheduledSend = {
    id:               randomUUID(),
    employeeId,
    employeeName:     employeeName || "",
    employeeEmail:    employeeEmail || "",
    message,
    gmailUser,
    gmailAppPassword,
    fromName:         fromName || "The HR Team",
    cc:               Array.isArray(cc) ? cc : [],
    ccBehavior:       ccBehavior || "cc",
    mood:             mood || "Sunny",
    fuel:             fuel || "Coffee",
    heroImageUrl:     heroImageUrl || undefined,
    paletteId:        paletteId || undefined,
    scheduledAt:      scheduled.toISOString(),
    status:           "pending",
    createdAt:        new Date().toISOString(),
  };

  await createScheduledSend(job);
  return NextResponse.json(job, { status: 201 });
}
