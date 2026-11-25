import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { summarizeCustomers } from "@/lib/customer-analytics";

async function collectAll<T>(fetch: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let start = 0; ; start += 1000) {
    const result = await fetch(start, start + 999);
    if (result.error || !result.data) throw new Error("تعذر تحميل بيانات العملاء");
    rows.push(...result.data); if (result.data.length < 1000) return rows;
  }
}

export const inspectCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ page: z.number().int().min(1), search: z.string().max(255), userId: z.string().uuid().optional(), activityPage: z.number().int().min(1).default(1) }))
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "customers" });
    if (error || !allowed) throw new Error("غير مسموح بالاطلاع على العملاء");
    let query = context.supabase.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (data.search.trim()) query = query.ilike("email", `%${data.search.trim().replace(/[%_]/g, "")}%`);
    const profiles = await query.range((data.page - 1) * 20, data.page * 20 - 1);
    if (profiles.error) throw new Error("تعذر تحميل العملاء");
    if (!data.userId) return { profiles: profiles.data, count: profiles.count ?? 0, shopping: null, activity: [], activityCount: 0 };
    const [shopping, activity] = await Promise.all([
      context.supabase.from("customer_shopping").select("*").eq("user_id", data.userId).maybeSingle(),
      context.supabase.from("customer_activity").select("*", { count: "exact" }).eq("user_id", data.userId).order("created_at", { ascending: false }).range((data.activityPage - 1) * 30, data.activityPage * 30 - 1),
    ]);
    if (shopping.error || activity.error) throw new Error("تعذر تحميل بيانات العميل");
    return { profiles: profiles.data, count: profiles.count ?? 0, shopping: shopping.data, activity: activity.data, activityCount: activity.count ?? 0 };
  });

export const exportCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed, error } = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "customers" });
    if (error || !allowed) throw new Error("غير مسموح بتصدير بيانات العملاء");
    const [profiles, shopping, activity, products] = await Promise.all([
      collectAll((a, b) => context.supabase.from("profiles").select("*").order("id").range(a, b)),
      collectAll((a, b) => context.supabase.from("customer_shopping").select("*").order("user_id").range(a, b)),
      collectAll((a, b) => context.supabase.from("customer_activity").select("*").order("id").range(a, b)),
      (async () => { const { sql } = await import("./mysql.server"); return (await sql(`SELECT id, name_ar FROM products ORDER BY id`)) as { id: string; name_ar: string }[]; })(),
    ]);
    return { profiles, shopping, activity, products, exportedAt: new Date().toISOString() };
  });

export const customerAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]) }))
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "customers" });
    if (error || !allowed) throw new Error("غير مسموح بالاطلاع على العملاء");
    // Read every page: the API's row cap must not silently truncate analytics.
    async function collect<T>(fetch: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
      const rows: T[] = [];
      for (let start = 0; ; start += 1000) {
        const result = await fetch(start, start + 999);
        if (result.error || !result.data) throw new Error("تعذر تحميل تحليلات العملاء");
        rows.push(...result.data); if (result.data.length < 1000) return rows;
      }
    }
    const [profiles, shopping, activity] = await Promise.all([
      collect((a, b) => context.supabase.from("profiles").select("*").order("id").range(a, b)),
      collect((a, b) => context.supabase.from("customer_shopping").select("*").order("user_id").range(a, b)),
      collect((a, b) => context.supabase.from("customer_activity").select("*").order("id").range(a, b)),
    ]);
    return summarizeCustomers(profiles, shopping, activity, data.days);
  });