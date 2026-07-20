import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getEmployee, appendLog, updateScheduledSendStatus } from "@/lib/birthdayhub/storage";
import { buildEmailHTML } from "@/lib/birthdayhub/email-template";
import { generateIllustrationUrl } from "@/lib/birthdayhub/generate-illustration";
import { logActivity } from "@/lib/activity";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

function getTransporter(gmailUser: string, gmailAppPassword: string) {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailAppPassword },
    tls: { rejectUnauthorized: false },
  });
}

export async function POST(req: Request) {
  const { employeeId, message, gmailUser, gmailAppPassword, fromName: bodyFromName, mood, fuel, heroImageUrl, paletteId, cc, ccBehavior, scheduledJobId } = await req.json();

  if (!employeeId || !message) {
    return NextResponse.json({ error: "employeeId and message are required" }, { status: 400 });
  }

  const resolvedGmailUser = gmailUser || process.env.GMAIL_USER;
  const resolvedGmailPass = gmailAppPassword || process.env.GMAIL_APP_PASSWORD;

  if (!resolvedGmailUser || !resolvedGmailPass) {
    return NextResponse.json(
      { error: "Gmail credentials are required. Please configure them before sending." },
      { status: 400 }
    );
  }

  const employee = await getEmployee(employeeId);
  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const fromName = bodyFromName || process.env.GMAIL_FROM_NAME || "The HR Team";
  const origin = new URL(req.url).origin;
  const logoUrl = `${origin}/birthday/rezolve.gif`;
  const resolvedHeroImageUrl = heroImageUrl || generateIllustrationUrl();

  const html = buildEmailHTML(
    employee.name, employee.department, message, fromName,
    undefined, mood, fuel, logoUrl, resolvedHeroImageUrl, paletteId
  );

  try {
    const transporter = getTransporter(resolvedGmailUser, resolvedGmailPass);
    const ccList = cc as string[] | undefined;
    const behavior: string = (ccList && ccList.length > 50) ? "bcc" : (ccBehavior || "cc");
    const recipientField = ccList?.length && behavior !== "none"
      ? { [behavior]: ccList.join(", ") }
      : {};
    await transporter.sendMail({
      from: `"${fromName}" <${resolvedGmailUser}>`,
      to: employee.email,
      ...recipientField,
      subject: `Happy Birthday, ${employee.name}!`,
      html,
    });

    const sentAt = new Date().toISOString();

    await appendLog({
      id: randomUUID(),
      employeeId: employee.id,
      employeeName: employee.name,
      sentAt,
      year: new Date().getFullYear(),
      status: "sent",
    });

    if (scheduledJobId) {
      await updateScheduledSendStatus(scheduledJobId, "sent", sentAt);
    }

    try {
      const session = await auth();
      if (session?.user?.id) {
        await logActivity({
          userId: session.user.id,
          sourceApp: "birthdayhub",
          eventType: "email_sent",
          title: `Birthday email sent to ${employee.name}`,
          description: `Sent birthday wishes to ${employee.email}`,
        });
      }
    } catch { /* activity logging is best-effort */ }

    return NextResponse.json({ ok: true, to: employee.email });
  } catch (err: unknown) {
    console.error("Gmail error:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    await appendLog({
      id: randomUUID(),
      employeeId: employee.id,
      employeeName: employee.name,
      sentAt: new Date().toISOString(),
      year: new Date().getFullYear(),
      status: "failed",
      error: errorMsg,
    });
    return NextResponse.json({ error: "Failed to send email", detail: errorMsg }, { status: 500 });
  }
}
