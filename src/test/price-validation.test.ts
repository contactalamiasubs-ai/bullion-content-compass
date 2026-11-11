import { describe, expect, it } from "vitest";
import { validateAnalysis, validateQuote, validateSourceUrl } from "@/lib/price-validation";
describe("trusted prices", () => {
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
