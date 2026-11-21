import { describe, expect, it, vi } from "vitest";
import { fetchValidatedQuote, validateAnalysis, validateQuote, validateSourceUrl } from "@/lib/price-validation";
describe("trusted prices", () => {
  it("reads a valid quote without unsupported redirect options", async () => {
    const quote = { symbol: "XAU", currency: "USD", price: 3539, updatedAt: new Date().toISOString() };
    const send = vi.fn().mockResolvedValue(Response.json(quote));
    expect(await fetchValidatedQuote("https://api.gold-api.com/price/XAU", "XAU", send)).toEqual(quote);
    expect(send).toHaveBeenCalledWith("https://api.gold-api.com/price/XAU", expect.objectContaining({ redirect: "manual" }));
  });
  it.each([301, 302, 303, 307, 308])("rejects source redirect %s before parsing or following it", async (status) => {
    const send = vi.fn().mockResolvedValue(new Response(null, { status, headers: { Location: "http://127.0.0.1/private" } }));
    await expect(fetchValidatedQuote("https://api.gold-api.com/price/XAU", "XAU", send)).rejects.toThrow(`(${status})`);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith("https://api.gold-api.com/price/XAU", expect.objectContaining({ redirect: "manual" }));
  });
  it("never contacts an unapproved provider", async () => {
    const send = vi.fn();
    await expect(fetchValidatedQuote("http://127.0.0.1/private", "XAU", send)).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects a source payload above the existing 20000 character limit", async () => {
    const send = vi.fn().mockResolvedValue(new Response(" ".repeat(20001)));
    await expect(fetchValidatedQuote("https://api.gold-api.com/price/XAU", "XAU", send)).rejects.toThrow("استجابة المصدر أكبر من الحد المسموح");
  });
  it("only allows the exact configured metal source", () => {
    expect(validateSourceUrl("https://api.gold-api.com/price/XAU", "XAU")).toBe(
      "https://api.gold-api.com/price/XAU",
    );
    for (const url of [
      "http://127.0.0.1",
      "https://api.gold-api.com/price/XAU?key=secret",
      "https://evil.example",
      "https://api.gold-api.com/price/XAG",
    ])
      expect(() => validateSourceUrl(url, "XAU")).toThrow();
  });
  it("rejects stale or mismatched source data", () => {
    const now = Date.parse("2026-11-10T12:00:00Z");
    const q = { symbol: "XAU", currency: "USD", price: 4074.6, updatedAt: "2026-11-10T11:59:00Z" };
    expect(validateQuote(q, "XAU", now).price).toBe(4074.6);
    expect(() => validateQuote(q, "XAG", now)).toThrow();
    expect(() => validateQuote({ ...q, updatedAt: "2026-11-10T11:00:00Z" }, "XAU", now)).toThrow();
  });
  it("never accepts model-invented or rounded prices", () => {
    const a = {
      accepted: true,
      gold_usd: 4074.6,
      silver_usd: 57.3,
      summary_ar: "تم",
      summary_en: "Validated",
    };
    expect(validateAnalysis(a, 4074.6, 57.3).gold_usd).toBe(4074.6);
    expect(() => validateAnalysis({ ...a, gold_usd: 4075 }, 4074.6, 57.3)).toThrow();
    expect(() => validateAnalysis({ ...a, accepted: false }, 4074.6, 57.3)).toThrow();
  });
});
