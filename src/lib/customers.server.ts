import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { summarizeCustomers } from "@/lib/customer-analytics";
import { customerAdminClient } from "@/lib/customer-admin.server";

export const customerBridgeUrl = "https://bullion-content-compass.lovable.app/api/public/customer-data";
export const customerCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("inspect"), page: z.number().int().min(1), search: z.string().max(255), userId: z.string().uuid().optional(), activityPage: z.number().int().min(1).default(1) }).strict(),
  z.object({ action: z.literal("export") }).strict(),
  z.object({ action: z.literal("analytics"), days: z.union([z.literal(7), z.literal(30), z.literal(90)]) }).strict(),
]);
export type CustomerCommand = z.infer<typeof customerCommandSchema>;
type Ctx = { supabase: SupabaseClient; userId: string };

async function collectAll<T>(fetch: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let start = 0; ; start += 1000) {
    const result = await fetch(start, start + 999);
    if (result.error || !result.data) throw new Error("تعذر تحميل بيانات العملاء");
    rows.push(...result.data); if (result.data.length < 1000) return rows;
  }
}

// Always re-checks the Cloud customer permission before touching the customer project.
export async function executeCustomerCommand(command: CustomerCommand, context: Ctx) {
  const { data: allowed, error } = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "customers" });
  if (error || !allowed) throw new Error("غير مسموح بالاطلاع على العملاء");
  const customers = await customerAdminClient();
  if (command.action === "inspect") {
    let query = customers.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (command.search.trim()) query = query.ilike("email", `%${command.search.trim().replace(/[%_]/g, "")}%`);
    const profiles = await query.range((command.page - 1) * 20, command.page * 20 - 1);
    if (profiles.error) throw new Error("تعذر تحميل العملاء");
    if (!command.userId) return { profiles: profiles.data, count: profiles.count ?? 0, shopping: null, activity: [], activityCount: 0 };
    const [shopping, activity] = await Promise.all([
      customers.from("customer_shopping").select("*").eq("user_id", command.userId).maybeSingle(),
      customers.from("customer_activity").select("*", { count: "exact" }).eq("user_id", command.userId).order("created_at", { ascending: false }).range((command.activityPage - 1) * 30, command.activityPage * 30 - 1),
    ]);
    if (shopping.error || activity.error) throw new Error("تعذر تحميل بيانات العميل");
    return { profiles: profiles.data, count: profiles.count ?? 0, shopping: shopping.data, activity: activity.data, activityCount: activity.count ?? 0 };
  }
  const [profiles, shopping, activity] = await Promise.all([
    collectAll((a, b) => customers.from("profiles").select("*").order("id").range(a, b)),
    collectAll((a, b) => customers.from("customer_shopping").select("*").order("user_id").range(a, b)),
    collectAll((a, b) => customers.from("customer_activity").select("*").order("id").range(a, b)),
  ]);
  if (command.action === "analytics") return summarizeCustomers(profiles as never, shopping as never, activity as never, command.days);
  const products = await collectAll((a, b) => context.supabase.from("products").select("id,name_ar").order("id").range(a, b));
  return { profiles, shopping, activity, products, exportedAt: new Date().toISOString() };
}

// External hosting has no customer-project token, so it relays to the pinned Lovable endpoint with the staff bearer.
export async function runCustomerCommand(command: CustomerCommand, context: Ctx) {
  if (process.env["CUSTOMER_PROJECT_MANAGEMENT_TOKEN"]) return executeCustomerCommand(command, context);
  const { getRequest } = await import("@tanstack/react-start/server");
  const authorization = getRequest().headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("يرجى تسجيل الدخول مرة أخرى.");
  let response: Response;
  try {
    response = await fetch(customerBridgeUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: authorization }, body: JSON.stringify(command), redirect: "manual", signal: AbortSignal.timeout(30000) });
  } catch { throw new Error("تعذر الاتصال بقاعدة العملاء؛ أعد المحاولة."); }
  const result = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;
  if (!response.ok || !result || !("data" in result)) throw new Error(result?.error ?? "تعذر الاتصال بقاعدة العملاء؛ انشر آخر تحديث على Lovable.");
  return result.data;
}

export async function handleCustomerBridge(request: Request) {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  try {
    const { authenticateAdminRequest } = await import("./admin-users.server");
    const context = await authenticateAdminRequest(request);
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({ error: "حجم الطلب غير مسموح." }, { status: 413, headers });
    const parsed = customerCommandSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return Response.json({ error: "بيانات الطلب غير صحيحة." }, { status: 400, headers });
    return Response.json({ data: await executeCustomerCommand(parsed.data, context) }, { headers });
  } catch (error) {
    const message = error instanceof Error && /^[\u0600-\u06FF]/.test(error.message) ? error.message : "تعذر تحميل بيانات العملاء.";
    const status = (error as { status?: number }).status ?? (message.startsWith("غير مسموح") ? 403 : 500);
    return Response.json({ error: message }, { status, headers });
  }
}
