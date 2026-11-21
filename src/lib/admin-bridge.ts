import { z } from "zod";
import { deleteAccountSchema, inviteSchema } from "./dashboard-permissions";

export const adminBridgeUrl = "https://bullion-content-compass.lovable.app/api/public/dashboard-users";
export const adminCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("list"), page: z.number().int().min(1).max(10000) }).strict(),
  deleteAccountSchema.extend({ action: z.literal("delete") }).strict(),
  inviteSchema.extend({ action: z.literal("invite"), redirectOrigin: z.string().url().max(256) }).strict(),
]);
export type AdminCommand = z.infer<typeof adminCommandSchema>;
export const adminListSchema = z.object({
  users: z.array(z.object({ id: z.string().uuid(), email: z.string(), confirmed: z.boolean(), admin: z.boolean(), permissions: z.array(z.string()) })),
  hasNext: z.boolean(),
});
export const adminSuccessSchema = z.object({ success: z.literal(true) });
export type AdminResult = z.infer<typeof adminListSchema> | z.infer<typeof adminSuccessSchema>;

export class AdminBridgeError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export function invitationRedirect(origin: string, additionalOrigins = "") {
  const allowed = [new URL(adminBridgeUrl).origin, "https://goldcenterstr.com", "https://www.goldcenterstr.com", ...additionalOrigins.split(",").map((value) => value.trim()).filter(Boolean)];
  const url = new URL(origin);
  if (url.protocol !== "https:" || url.origin !== origin || url.username || url.password || !allowed.includes(origin)) {
    throw new AdminBridgeError("دومين الدعوة غير معتمد؛ أضفه إلى إعدادات ربط إدارة المستخدمين أولًا.", 400);
  }
  return new URL("/set-password", origin).href;
}

// Hostinger calls the published app server-to-server. Never forward a user's token to arbitrary URLs.
export async function forwardAdminCommand(url: string, authorization: string | null, command: AdminCommand, send: typeof fetch = fetch): Promise<unknown> {
  if (url !== adminBridgeUrl) throw new AdminBridgeError("رابط ربط إدارة المستخدمين غير صحيح؛ استخدم الرابط المحدد في دليل الاستضافة.", 500);
  if (!authorization?.startsWith("Bearer ") || !authorization.slice(7)) throw new AdminBridgeError("يرجى تسجيل الدخول مرة أخرى.", 401);
  let response: Response;
  try {
    response = await send(url, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify(adminCommandSchema.parse(command)), redirect: "error", signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new AdminBridgeError("تعذر الاتصال بإدارة المستخدمين؛ تأكد أن نسخة Lovable منشورة وأعد المحاولة.", 502);
  }
  let result: unknown;
  try { result = await response.json(); } catch {
    throw new AdminBridgeError("ربط إدارة المستخدمين غير متاح؛ انشر آخر تحديث على Lovable أولًا.", 502);
  }
  if (!response.ok) {
    const parsed = z.object({ error: z.string().max(500) }).safeParse(result);
    throw new AdminBridgeError(parsed.success ? parsed.data.error : "تعذر تنفيذ العملية في إدارة المستخدمين.", response.status);
  }
  const envelope = z.object({ data: z.unknown() }).safeParse(result);
  if (!envelope.success) throw new AdminBridgeError("استجابة ربط إدارة المستخدمين غير صحيحة.", 502);
  return envelope.data.data;
}