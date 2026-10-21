import nodemailer from "nodemailer";
import { env } from "../env";
import { logger } from "./logger";
import { escapeHtml } from "./sanitize";

const transporter =
  env.SMTP_HOST && env.SMTP_USER
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      })
    : null;

export interface ContactNotification {
  to: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

async function sendViaResend(n: ContactNotification, apiKey: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM ?? "Portfolio <onboarding@resend.dev>",
      to: [n.to],
      reply_to: n.email,
      subject: `New portfolio message: ${n.subject}`,
      text: `From: ${n.name} <${n.email}>\n\n${n.message}`,
      html: body(n),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

const body = (n: ContactNotification): string =>
  `<p><strong>${escapeHtml(n.name)}</strong> &lt;${escapeHtml(n.email)}&gt;</p><p>${escapeHtml(n.message).replaceAll("\n", "<br>")}</p>`;

/**
 * Fire-and-forget: the message is already stored, so email problems are only logged.
 * Uses the Resend HTTPS API when RESEND_API_KEY is set (works on hosts that block SMTP), otherwise SMTP.
 */
export function notifyContact(n: ContactNotification): void {
  if (env.RESEND_API_KEY) {
    void sendViaResend(n, env.RESEND_API_KEY).catch((err: unknown) => {
      logger.error({ err }, "Failed to send contact notification (Resend)");
    });
    return;
  }
  if (!transporter) return;
  void transporter
    .sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      to: n.to,
      replyTo: n.email,
      subject: `New portfolio message: ${n.subject}`,
      text: `From: ${n.name} <${n.email}>\n\n${n.message}`,
      html: body(n),
    })
    .catch((err: unknown) => {
      logger.error({ err }, "Failed to send contact notification (SMTP)");
    });
}
