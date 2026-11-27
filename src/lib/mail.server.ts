// Site mail sending over SMTP (Hostinger mailbox or any SMTP server).
// Configuration comes only from server environment variables; the mailbox
// password is never returned to the browser and never written to logs.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type MailConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
};

export function isEmail(value: string): boolean {
  return value.length <= 200 && EMAIL_RE.test(value);
}

export function mailConfig(): MailConfig | null {
  const host = (process.env["SMTP_HOST"] ?? "smtp.hostinger.com").trim();
  const user = (process.env["SMTP_USER"] ?? "").trim();
  const pass = process.env["SMTP_PASS"] ?? "";
  if (!host || !user || !pass) return null;
  const rawPort = (process.env["SMTP_PORT"] ?? "465").trim();
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  const from = (process.env["MAIL_FROM"] ?? user).trim();
  const to = (process.env["MAIL_TO"] ?? user).trim();
  if (!isEmail(from) || !isEmail(to)) return null;
  return { host, port, user, pass, from, to };
}

// Flags for the dashboard: never includes the password.
export function mailStatusFlags() {
  const config = mailConfig();
  if (!config) return { configured: false, host: "", port: 0, from: "", to: "" };
  return { configured: true, host: config.host, port: config.port, from: config.from, to: config.to };
}

export type MailInput = { to: string; subject: string; text: string; html?: string };
export type MailResult = { sent: boolean; reason?: string };

const MAX_TEXT = 20000;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

// Plain-text part plus a light HTML part so the message reads well in webmail.
export function mailBodies(text: string): { text: string; html: string } {
  const safe = escapeHtml(text);
  return { text, html: `<div style="font-family:system-ui,Arial,sans-serif;white-space:pre-wrap">${safe}</div>` };
}

export async function sendMail(input: MailInput): Promise<MailResult> {
  const config = mailConfig();
  if (!config) return { sent: false, reason: "not_configured" };
  if (!isEmail(input.to)) return { sent: false, reason: "invalid_recipient" };
  const subject = input.subject.slice(0, 200);
  const body = mailBodies(input.text.slice(0, MAX_TEXT));
  try {
    const { createTransport } = await import("nodemailer");
    const transport = createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
    await transport.sendMail({ from: config.from, replyTo: config.from, ...input, subject, text: body.text, html: input.html ?? body.html });
    transport.close();
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    // Keep the failure readable but never echo credentials back.
    const clean = message.replace(config.pass, "****").slice(0, 300);
    return { sent: false, reason: clean };
  }
}

// One notification per visitor address per window, so a refreshed form cannot
// flood the owner's mailbox.
const lastNotice = new Map<string, number>();
const NOTICE_WINDOW_MS = 60_000;

export function noticeAllowed(key: string, now = Date.now()): boolean {
  const previous = lastNotice.get(key);
  if (previous !== undefined && now - previous < NOTICE_WINDOW_MS) return false;
  lastNotice.set(key, now);
  if (lastNotice.size > 500) {
    for (const [k, t] of lastNotice) {
      if (now - t > NOTICE_WINDOW_MS * 5) lastNotice.delete(k);
    }
  }
  return true;
}

export function contactNoticeText(data: { name: string; email: string; phone: string; message: string }): string {
  return [
    `الاسم: ${data.name}`,
    `البريد: ${data.email}`,
    `الهاتف: ${data.phone || "غير محدد"}`,
    "",
    data.message,
  ].join("\n");
}
