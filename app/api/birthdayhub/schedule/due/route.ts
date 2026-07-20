import { NextResponse } from "next/server";
import { getDueScheduledSends } from "@/lib/birthdayhub/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const due = await getDueScheduledSends();
  return NextResponse.json(due);
}
