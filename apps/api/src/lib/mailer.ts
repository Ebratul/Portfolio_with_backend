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

/** Fire-and-forget: the message is already stored, so email problems are only logged. */
export function notifyContact(n: ContactNotification): void {
  if (!transporter) return;
  void transporter
    .sendMail({
      from: env.SMTP_FROM ?? env.SMTP_USER,
      to: n.to,
      replyTo: n.email,
      subject: `New portfolio message: ${n.subject}`,
      text: `From: ${n.name} <${n.email}>\n\n${n.message}`,
      html: `<p><strong>${escapeHtml(n.name)}</strong> &lt;${escapeHtml(n.email)}&gt;</p><p>${escapeHtml(n.message).replaceAll("\n", "<br>")}</p>`,
    })
    .catch((err: unknown) => {
      logger.error({ err }, "Failed to send contact notification");
    });
}
