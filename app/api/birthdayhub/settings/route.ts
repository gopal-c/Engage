import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/birthdayhub/storage";
import type { AppSettings } from "@/lib/birthdayhub/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<AppSettings>;
  const current = await getSettings();
  const updated: AppSettings = {
    fromName:        body.fromName        ?? current.fromName,
    replyTo:         body.replyTo         ?? current.replyTo,
    autoSendEnabled: body.autoSendEnabled ?? current.autoSendEnabled,
    sendTimeIST:     body.sendTimeIST     ?? current.sendTimeIST,
    sendTimeUTC:     body.sendTimeUTC     ?? current.sendTimeUTC,
    cronExpression:  body.cronExpression  ?? current.cronExpression,
    ccMode:          body.ccMode          ?? current.ccMode,
    customCCList:    body.customCCList    ?? current.customCCList,
    bccOverride:     body.bccOverride     ?? current.bccOverride,
  };
  await saveSettings(updated);
  return NextResponse.json(updated);
}
