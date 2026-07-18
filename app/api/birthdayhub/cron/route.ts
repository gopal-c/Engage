import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { generateBirthdayMessage } from "@/lib/birthdayhub/groq";
import { sendBirthdayEmail } from "@/lib/birthdayhub/mailer";

export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get("x-cron-secret");
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayMMDD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const year = now.getFullYear();

  const settingsRows = await sql`
    SELECT key, value FROM birthdayhub.settings
  `;
  const settings: Record<string, unknown> = {};
  for (const row of settingsRows as { key: string; value: unknown }[]) {
    settings[row.key] = row.value;
  }

  if (settings.auto_send === false) {
    return NextResponse.json({ message: "Auto-send disabled", sent: 0 });
  }

  const employees = await sql`
    SELECT e.* FROM birthdayhub.employees e
    WHERE e.birthday = ${todayMMDD}
    AND e.id NOT IN (
      SELECT employee_id FROM birthdayhub.send_logs
      WHERE year = ${year} AND status = 'sent'
    )
  `;

  const results: { name: string; status: string; error?: string }[] = [];

  for (const emp of employees as { id: string; name: string; email: string; department: string | null; notes: string | null }[]) {
    try {
      const aiMessage = await generateBirthdayMessage(emp.name, emp.department, emp.notes);

      const lines = aiMessage.split("\n");
      const subjectLine = lines.find((l) => l.startsWith("Subject:"));
      const subject = subjectLine ? subjectLine.replace("Subject:", "").trim() : `Happy Birthday, ${emp.name}!`;
      const bodyText = lines.filter((l) => !l.startsWith("Subject:")).join("\n").trim();

      const illustrations = ["birthday-1.png", "birthday-2.png", "birthday-3.png", "birthday-4.png", "birthday-5.png", "birthday-6.png"];
      const illustration = illustrations[Math.floor(Math.random() * illustrations.length)];

      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <img src="${process.env.NEXTAUTH_URL || "https://engage.vercel.app"}/birthday/${illustration}"
               alt="Happy Birthday" style="width:100%;max-width:400px;border-radius:12px;margin-bottom:20px;" />
          <div style="white-space:pre-wrap;line-height:1.6;font-size:15px;">${bodyText}</div>
          <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
          <p style="font-size:12px;color:#888;">Sent with love from ValueAdd SoftTech via BirthdayHub</p>
        </div>
      `;

      await sendBirthdayEmail({
        to: emp.email,
        subject,
        html,
        fromName: (settings.from_name as string) || "BirthdayHub",
        cc: (settings.cc_list as string[]) || [],
        bcc: (settings.bcc_list as string[]) || [],
      });

      await sql`
        INSERT INTO birthdayhub.send_logs (employee_id, employee_name, year, status)
        VALUES (${emp.id}, ${emp.name}, ${year}, 'sent')
      `;

      results.push({ name: emp.name, status: "sent" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      await sql`
        INSERT INTO birthdayhub.send_logs (employee_id, employee_name, year, status, error)
        VALUES (${emp.id}, ${emp.name}, ${year}, 'failed', ${msg})
      `;
      results.push({ name: emp.name, status: "failed", error: msg });
    }
  }

  return NextResponse.json({
    date: todayMMDD,
    checked: employees.length,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
  });
}
