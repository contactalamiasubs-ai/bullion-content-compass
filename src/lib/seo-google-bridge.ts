import { z } from "zod";
import { adminBridgeUrl, AdminBridgeError } from "@/lib/admin-bridge";
import { publicPathSchema } from "@/lib/seo";

export const seoGoogleBridgeUrl = new URL("/api/public/seo-google", adminBridgeUrl).href;
export const seoGoogleCommand = z.discriminatedUnion("action", [
  z.object({ action: z.literal("refresh"), siteUrl: z.string().max(300).optional() }).strict(),
  z.object({ action: z.literal("inspect"), path: publicPathSchema }).strict(),
  z.object({ action: z.literal("verify") }).strict(),
  z.object({ action: z.literal("status") }).strict(),
]);
export type SeoGoogleCommand = z.infer<typeof seoGoogleCommand>;
export async function forwardSeoGoogle<T>(authorization: string | null, command: SeoGoogleCommand, send: typeof fetch = fetch): Promise<T> {
  if (!authorization?.startsWith("Bearer ") || !authorization.slice(7)) throw new AdminBridgeError("سجل الدخول مرة أخرى.", 401);
  const response = await send(seoGoogleBridgeUrl, { method: "POST", headers: { Authorization: authorization, "Content-Type": "application/json" }, body: JSON.stringify(seoGoogleCommand.parse(command)), redirect: "manual", signal: AbortSignal.timeout(90000) });
  if (response.status >= 300 && response.status < 400) throw new AdminBridgeError("انشر نسخة Lovable الخاصة بتقارير Google أولًا.", 502);
  const text = await response.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { throw new AdminBridgeError("انشر تحديث تقارير Google على Lovable أولًا.",502); }
  if (!response.ok) { const error = z.object({ error: z.string() }).safeParse(json); throw new AdminBridgeError(error.success ? error.data.error : "تعذر الاتصال بتقارير Google.", response.status); }
  const result = z.object({ data: z.unknown() }).safeParse(json);
  if (!result.success) throw new AdminBridgeError("استجابة تقارير Google غير صحيحة.", 502);
  return result.data.data as T;
}