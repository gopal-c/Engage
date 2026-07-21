import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

export function appUrl(): string {
  return process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

type SendResult = { ok: boolean; error?: string };

async function send(to: string, subject: string, html: string, text: string): Promise<SendResult> {
  const t = getTransporter();
  if (!t) {
    console.error("[skillshub-email] GMAIL_USER / GMAIL_APP_PASSWORD not configured — skipping send.");
    return { ok: false, error: "Email is not configured on this server." };
  }
  try {
    await t.sendMail({
      from: `SkillsHub <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "send failed";
    console.error(`[skillshub-email] send to ${to} failed: ${message}`);
    return { ok: false, error: message };
  }
}

function layout(opts: { heading: string; bodyHtml: string; ctaLabel: string; ctaUrl: string; footnote: string }): string {
  const { heading, bodyHtml, ctaLabel, ctaUrl, footnote } = opts;
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#151634;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#151634;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1A1A2E;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 8px;">
                <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#8B7BE8;margin-bottom:16px;">SkillsHub</div>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#FFFFFF;font-weight:600;">${heading}</h1>
                <div style="font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);">${bodyHtml}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px;">
                <a href="${ctaUrl}" style="display:inline-block;background:#6B58D9;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:500;padding:12px 24px;border-radius:10px;">${ctaLabel}</a>
                <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.45);word-break:break-all;">
                  Or paste this link into your browser:<br>
                  <a href="${ctaUrl}" style="color:#8B7BE8;">${ctaUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px;border-top:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.40);">${footnote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string): Promise<SendResult> {
  const url = `${appUrl()}/apps/skillshub/verify-email?token=${encodeURIComponent(token)}`;
  const html = layout({
    heading: "Verify your work email",
    bodyHtml: `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p><p style="margin:0;">Confirm this is your work email to finish setting up your SkillsHub account. This link expires in 24 hours.</p>`,
    ctaLabel: "Verify email",
    ctaUrl: url,
    footnote: "If you didn't request this, you can safely ignore this email.",
  });
  const text = `Hi ${name},\n\nVerify your SkillsHub work email: ${url}\n\nThis link expires in 24 hours. If you didn't request this, ignore this email.`;
  return send(to, "Verify your SkillsHub work email", html, text);
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<SendResult> {
  const url = `${appUrl()}/apps/skillshub/reset-password?token=${encodeURIComponent(token)}`;
  const html = layout({
    heading: "Reset your password",
    bodyHtml: `<p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p><p style="margin:0;">We got a request to reset your SkillsHub password. This link expires in 1 hour. If you didn't request this, ignore this email — your password won't change.</p>`,
    ctaLabel: "Reset password",
    ctaUrl: url,
    footnote: "If you didn't request this, ignore this email.",
  });
  const text = `Hi ${name},\n\nReset your SkillsHub password: ${url}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`;
  return send(to, "Reset your SkillsHub password", html, text);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
