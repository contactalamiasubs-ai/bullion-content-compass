import { z } from "zod";

// An exact provider allowlist avoids arbitrary URLs, redirects, DNS rebinding and credentials in URLs.
export function validateSourceUrl(value: string, symbol: "XAU" | "XAG") {
  const expected = `https://api.gold-api.com/price/${symbol}`;
  if (value !== expected)
    throw new Error("المصدر المدعوم حاليًا هو Gold API؛ استخدم رابط المعدن المحدد بدون إضافات.");
  return expected;
}
export const quoteSchema = z.object({
  symbol: z.enum(["XAU", "XAG"]),
  price: z.number().finite().positive(),
  currency: z.literal("USD"),
  updatedAt: z.string().datetime(),
});
export function validateQuote(value: unknown, symbol: "XAU" | "XAG", now = Date.now()) {
  const q = quoteSchema.parse(value);
  if (q.symbol !== symbol) throw new Error("المعدن لا يطابق المصدر");
  const age = now - Date.parse(q.updatedAt);
  if (age > 15 * 60 * 1000 || age < -60 * 1000)
    throw new Error("بيانات المصدر قديمة أو توقيتها غير صالح");
  return q;
}
export async function fetchValidatedQuote(url: string, symbol: "XAU" | "XAG", send: typeof fetch = fetch) {
  const source = validateSourceUrl(url, symbol);
  const res = await send(source, {
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
    headers: { Accept: "application/json" },
  });
  // A redirect must never bypass the exact provider allowlist.
  if (!res.ok) throw new Error(`تعذر قراءة مصدر الأسعار (${res.status})`);
  const body = await res.text();
  if (body.length > 20000) throw new Error("استجابة المصدر أكبر من الحد المسموح");
  return validateQuote(JSON.parse(body), symbol);
}
export const analysisSchema = z.object({
  accepted: z.boolean(),
  gold_usd: z.number().positive(),
  silver_usd: z.number().positive(),
  summary_ar: z.string().min(1).max(600),
  summary_en: z.string().min(1).max(600),
});
export function validateAnalysis(value: unknown, gold: number, silver: number) {
  const a = analysisSchema.parse(value);
  if (!a.accepted || a.gold_usd !== gold || a.silver_usd !== silver)
    throw new Error("التحليل لم يؤكد أرقام المصدر؛ لم تُغيّر الأسعار.");
  return a;
}
