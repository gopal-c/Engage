import { NextResponse, NextRequest } from "next/server";
import nodemailer from "nodemailer";
import {
  getEmployees, getLogs, appendLog, todayMMDD, alreadySentThisYear,
  getDueScheduledSends, updateScheduledSendStatus, getSettings,
  getExcludedEmails,
} from "@/lib/birthdayhub/storage";
import { buildEmailHTML, resolvePalette } from "@/lib/birthdayhub/email-template";
import { generateIllustrationUrl } from "@/lib/birthdayhub/generate-illustration";
import { randomUUID } from "crypto";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { birthdaySent: 0, birthdayFailed: 0, scheduledSent: 0, scheduledFailed: 0 };
  const settings = await getSettings();
  const today = todayMMDD();
  let employees: Awaited<ReturnType<typeof getEmployees>> = [];
  let logs: Awaited<ReturnType<typeof getLogs>> = [];
  let birthdayPeople: typeof employees = [];

  // 1. Birthday emails
  if (!settings.autoSendEnabled) {
    results.birthdaySent = 0;
    results.birthdayFailed = 0;
  } else
  try {
    const [emps, l, excludedEmails] = await Promise.all([getEmployees(), getLogs(), getExcludedEmails()]);
    employees = emps;
    logs = l;

    birthdayPeople = employees.filter(
      (e) => e.birthday === today && !alreadySentThisYear(logs, e.id) && !excludedEmails.has(e.email.toLowerCase())
    );

    if (birthdayPeople.length > 0) {
      const fromName = settings.fromName;
      const logoUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/birthday/rezolve.gif`
        : undefined;

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
        tls: { rejectUnauthorized: false },
      });

      const birthdayResults = await Promise.allSettled(
        birthdayPeople.map(async (employee) => {
          const completion = await getGroqClient().chat.completions.create({
            model: GROQ_MODEL,
            max_tokens: 300,
            messages: [{
              role: "user",
              content: `Write a birthday message for ${employee.name}.

Return ONLY a valid JSON object:
{
  "message": "Dear ${employee.name}, [exactly 1 warm birthday sentence using we/our, never I/my]",
  "mood": "[one upbeat word for their vibe today]",
  "fuel": "[what they probably run on, 1-2 words]"
}`,
            }],
          });

          const raw = completion.choices[0]?.message?.content ?? "";
          const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          let message = `Dear ${employee.name}, wishing you a wonderful birthday from all of us!`;
          let mood = "Sunny";
          let fuel = "Coffee";
          try {
            const parsed = JSON.parse(cleaned);
            message = parsed.message || message;
            mood    = parsed.mood    || mood;
            fuel    = parsed.fuel    || fuel;
          } catch { /* keep defaults */ }

          const palette = resolvePalette();
          const heroImageUrl = generateIllustrationUrl();
          const html = buildEmailHTML(
            employee.name, "", message, fromName,
            undefined, mood, fuel, logoUrl, heroImageUrl, palette.id
          );

          let ccEmails: string[] = [];
          if (settings.ccMode === "all") {
            ccEmails = employees
              .filter((e) => e.id !== employee.id && e.email && !excludedEmails.has(e.email.toLowerCase()))
              .map((e) => e.email);
          } else if (settings.ccMode === "custom") {
            ccEmails = (settings.customCCList || []).filter((e) => !excludedEmails.has(e.toLowerCase()));
          }

          const useBcc = settings.bccOverride && ccEmails.length > 50;
          const recipientField =
            ccEmails.length > 0
              ? { [useBcc ? "bcc" : "cc"]: ccEmails.join(", ") }
              : {};

          await transporter.sendMail({
            from:    `"${fromName}" <${process.env.GMAIL_USER}>`,
            to:      employee.email,
            ...recipientField,
            ...(settings.replyTo ? { replyTo: settings.replyTo } : {}),
            subject: `Happy Birthday, ${employee.name}!`,
            html,
          });

          await appendLog({
            id: randomUUID(), employeeId: employee.id, employeeName: employee.name,
            sentAt: new Date().toISOString(), year: new Date().getFullYear(), status: "sent",
          });
        })
      );

      results.birthdaySent   = birthdayResults.filter((r) => r.status === "fulfilled").length;
      results.birthdayFailed = birthdayResults.filter((r) => r.status === "rejected").length;

      for (let i = 0; i < birthdayResults.length; i++) {
        const r = birthdayResults[i];
        if (r.status === "rejected") {
          console.error(`Birthday send failed for ${birthdayPeople[i].name}:`, r.reason);
          await appendLog({
            id: randomUUID(), employeeId: birthdayPeople[i].id,
            employeeName: birthdayPeople[i].name, sentAt: new Date().toISOString(),
            year: new Date().getFullYear(), status: "failed", error: String(r.reason),
          });
        }
      }
    }
  } catch (err) {
    console.error("Birthday send phase error:", err);
  }

  // 2. Scheduled sends
  try {
    const due = await getDueScheduledSends();

    const scheduledResults = await Promise.allSettled(
      due.map(async (job) => {
        const logoUrl = process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/birthday/rezolve.gif`
          : undefined;

        const jobHeroImageUrl = job.heroImageUrl || generateIllustrationUrl();
        const html = buildEmailHTML(
          job.employeeName, "", job.message, job.fromName,
          undefined, job.mood, job.fuel, logoUrl, jobHeroImageUrl, job.paletteId
        );

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: job.gmailUser, pass: job.gmailAppPassword },
          tls: { rejectUnauthorized: false },
        });

        const jobCcList = job.cc || [];
        const jobBehavior = jobCcList.length > 50 ? "bcc" : (job.ccBehavior || "cc");
        const jobRecipientField = jobCcList.length > 0 && jobBehavior !== "none"
          ? { [jobBehavior]: jobCcList.join(", ") }
          : {};

        await transporter.sendMail({
          from:    `"${job.fromName}" <${job.gmailUser}>`,
          to:      job.employeeEmail,
          ...jobRecipientField,
          subject: `Happy Birthday, ${job.employeeName}!`,
          html,
        });

        await updateScheduledSendStatus(job.id, "sent", new Date().toISOString());
      })
    );

    results.scheduledSent   = scheduledResults.filter((r) => r.status === "fulfilled").length;
    results.scheduledFailed = scheduledResults.filter((r) => r.status === "rejected").length;

    for (let i = 0; i < scheduledResults.length; i++) {
      if (scheduledResults[i].status === "rejected") {
        const r = scheduledResults[i] as PromiseRejectedResult;
        console.error(`Scheduled send failed for job ${due[i].id}:`, r.reason);
        await updateScheduledSendStatus(due[i].id, "pending");
      }
    }
  } catch (err) {
    console.error("Scheduled send phase error:", err);
  }

  const year = new Date().getFullYear();
  return NextResponse.json({
    ...results,
    today,
    autoSendEnabled: settings.autoSendEnabled,
    totalEmployees: employees.length,
    birthdayPeople: birthdayPeople.map((e) => ({ name: e.name, birthday: e.birthday })),
    alreadySentIds: logs
      .filter((l) => l.year === year && l.status === "sent")
      .map((l) => l.employeeId),
  });
}
