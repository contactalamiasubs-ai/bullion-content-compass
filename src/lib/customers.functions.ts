import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const inspectCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ page: z.number().int().min(1), search: z.string().max(255), userId: z.string().uuid().optional(), activityPage: z.number().int().min(1).default(1) }))
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
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