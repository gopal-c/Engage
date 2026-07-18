import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { sendBirthdayEmail } from "@/lib/birthdayhub/mailer";
import { logActivity } from "@/lib/activity";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { employeeId, subject, html } = body;

  if (!employeeId || !subject || !html) {
    return NextResponse.json(
      { error: "employeeId, subject, and html are required" },
      { status: 400 }
    );
  }

  const employees = await sql`
    SELECT id, name, email, department FROM birthdayhub.employees WHERE id = ${employeeId}
  `;

  if (employees.length === 0) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const employee = employees[0] as { id: string; name: string; email: string; department: string | null };

  const settingsRows = await sql`
    SELECT key, value FROM birthdayhub.settings WHERE key IN ('from_name', 'cc_list', 'bcc_list')
  `;
  const settings: Record<string, unknown> = {};
  for (const row of settingsRows as { key: string; value: unknown }[]) {
    settings[row.key] = row.value;
  }

  const year = new Date().getFullYear();

  try {
    await sendBirthdayEmail({
      to: employee.email,
      subject,
      html,
      fromName: (settings.from_name as string) || "BirthdayHub",
      cc: (settings.cc_list as string[]) || [],
      bcc: (settings.bcc_list as string[]) || [],
    });

    await sql`
      INSERT INTO birthdayhub.send_logs (employee_id, employee_name, year, status)
      VALUES (${employee.id}, ${employee.name}, ${year}, 'sent')
    `;

    await logActivity({
      userId: session.user.id,
      sourceApp: "birthdayhub",
      eventType: "email_sent",
      title: `Birthday email sent to ${employee.name}`,
      description: subject,
      metadata: { employeeId: employee.id, year },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);

    await sql`
      INSERT INTO birthdayhub.send_logs (employee_id, employee_name, year, status, error)
      VALUES (${employee.id}, ${employee.name}, ${year}, 'failed', ${msg})
    `;

    return NextResponse.json({ error: `Send failed: ${msg}` }, { status: 500 });
  }
}
