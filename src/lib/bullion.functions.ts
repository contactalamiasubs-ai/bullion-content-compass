import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bullionRowSchema } from "@/lib/bullion-serials";

export const importBullionSerials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.array(bullionRowSchema).min(1).max(1000).refine(rows => new Set(rows.map(row => row.serial)).size === rows.length, "السيريالات مكررة"))
  .handler(async ({ data, context }) => {
    const permission = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "products" });
    if (permission.error || !permission.data) throw new Error("لا تملك صلاحية إدارة السيريالات");
    const result = await context.supabase.from("bullion_serials").upsert(data, { onConflict: "serial" });
    if (result.error) throw new Error("تعذر حفظ السيريالات؛ لم يتم استيراد الملف");
    return { count: data.length };
  });