import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    const chain: { validate?: (i: unknown) => unknown; run?: (i: { data: unknown }) => Promise<unknown> } = {};
    const api = {
      middleware: () => api,
      inputValidator: (validate: (i: unknown) => unknown) => { chain.validate = validate; return api; },
      handler: (run: (i: { data: unknown }) => Promise<unknown>) => { chain.run = run; return chain; },
    };
    return api;
  },
}));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("nodemailer", () => ({ createTransport: vi.fn() }));

import { isEmail, mailBodies, mailConfig, mailStatusFlags, noticeAllowed, sendMail } from "@/lib/mail.server";
import { notifyContactMessage } from "@/lib/mail.functions";

const notice = notifyContactMessage as unknown as { validate: (i: unknown) => unknown; run: (i: { data: unknown }) => Promise<unknown> };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("site mail configuration", () => {
  it("stays unconfigured without a mailbox user and password", () => {
    expect(mailConfig()).toBeNull();
    expect(mailStatusFlags()).toEqual({ configured: false, host: "", port: 0, from: "", to: "" });
  });

  it("reads Hostinger SMTP settings from the environment without exposing the password", () => {
    vi.stubEnv("SMTP_HOST", "smtp.hostinger.com");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_USER", "info@goldcenterstr.com");
    vi.stubEnv("SMTP_PASS", "secret-mailbox-pass");
    const status = mailStatusFlags();
    expect(status).toEqual({ configured: true, host: "smtp.hostinger.com", port: 465, from: "info@goldcenterstr.com", to: "info@goldcenterstr.com" });
    expect(JSON.stringify(status)).not.toContain("secret-mailbox-pass");
  });

  it("refuses an unusable port instead of guessing one", () => {
    vi.stubEnv("SMTP_USER", "info@goldcenterstr.com");
    vi.stubEnv("SMTP_PASS", "x");
    vi.stubEnv("SMTP_PORT", "0");
    expect(mailConfig()).toBeNull();
  });

  it("rejects malformed addresses and keeps message bodies plain-text safe", () => {
    expect(isEmail("info@goldcenterstr.com")).toBe(true);
    expect(isEmail("not-an-email")).toBe(false);
    const body = mailBodies("مرحبا <b>زائر</b>");
    expect(body.text).toBe("مرحبا <b>زائر</b>");
    expect(body.html).toContain("&lt;b&gt;");
  });

  it("reports not configured instead of opening a connection when SMTP is absent", async () => {
    const { createTransport } = await import("nodemailer");
    expect(await sendMail({ to: "info@goldcenterstr.com", subject: "x", text: "y" })).toEqual({ sent: false, reason: "not_configured" });
    expect(createTransport).not.toHaveBeenCalled();
  });
});

describe("contact message notification", () => {
  it("never sends to an address supplied by the visitor", async () => {
    const result = await notice.run({ data: { name: "زائر", email: "evil@elsewhere.test", phone: "", message: "مرحبا" } });
    expect(result).toEqual({ sent: false, reason: "not_configured" });
  });

  it("blocks a repeated notice from the same address inside the window", () => {
    expect(noticeAllowed("contact:a@b.test", 1_000)).toBe(true);
    expect(noticeAllowed("contact:a@b.test", 2_000)).toBe(false);
    expect(noticeAllowed("contact:a@b.test", 120_000)).toBe(true);
  });

  it("rejects a message longer than the stored limit", () => {
    expect(() => notice.validate({ name: "زائر", email: "a@b.test", phone: "", message: "x".repeat(3001) })).toThrow();
  });
});
