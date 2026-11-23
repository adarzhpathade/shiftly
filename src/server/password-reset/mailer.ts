import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

export function getMailerTransport(): Transporter {
  if (transporter) {
    return transporter;
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Missing email configuration: GMAIL_USER and GMAIL_APP_PASSWORD must be defined",
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

/** Resets the cached transporter. Useful for tests. */
export function resetMailerTransportForTesting(): void {
  transporter = null;
}

export async function sendResetCode(to: string, code: string): Promise<void> {
  const transport = getMailerTransport();
  const user = process.env.GMAIL_USER!;

  const text = [
    `Your Shiftly reset code is: ${code}`,
    "",
    "This code expires in 15 minutes.",
    "If you didn't ask for a reset code, you can safely ignore this email.",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Shiftly reset code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Your Shiftly reset code</h2>
    <p style="margin: 16px 0; color: #475569; font-size: 15px;">Use the 6-digit code below to reset your password:</p>
    <div style="background-color: #f1f5f9; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f172a;">${code}</span>
    </div>
    <p style="margin: 16px 0; color: #64748b; font-size: 14px;">This code expires in 15 minutes.</p>
    <p style="margin: 16px 0 0; color: #94a3b8; font-size: 13px;">If you didn't ask for a reset code, you can safely ignore this email.</p>
  </div>
</body>
</html>
`.trim();

  await transport.sendMail({
    from: `Shiftly <${user}>`,
    to,
    subject: "Your Shiftly reset code",
    text,
    html,
  });
}
