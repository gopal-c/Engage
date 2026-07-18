import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendBirthdayEmail({
  to,
  subject,
  html,
  fromName,
  cc,
  bcc,
}: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  cc?: string[];
  bcc?: string[];
}) {
  const from = `${fromName || "BirthdayHub"} <${process.env.GMAIL_USER}>`;

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
    cc: cc?.length ? cc.join(", ") : undefined,
    bcc: bcc?.length ? bcc.join(", ") : undefined,
  });
}
