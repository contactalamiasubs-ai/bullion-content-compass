import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bullionRowSchema } from "@/lib/bullion-serials";

export const importBullionSerials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.array(bullionRowSchema).min(1).max(1000).refine(rows => new Set(rows.map(row => row.serial)).size === rows.length, "السيريالات مكررة"))
  .handler(async ({ data, context }) => {
    const permission = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "serials" });
    if (permission.error || !permission.data) throw new Error("لا تملك صلاحية إدارة السيريالات");
    const { getPool } = await import("./mysql.server");
    const conn = await (await getPool()).getConnection();
    try {
      // All rows are saved together or none are (atomic import).
      await conn.beginTransaction();
      for (const r of data)
        await conn.query(
          "INSERT INTO bullion_serials (id, serial, name_ar, name_en, weight_grams, purity, specifications_ar, specifications_en, active, created_at) VALUES (?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(3)) ON DUPLICATE KEY UPDATE name_ar=VALUES(name_ar), name_en=VALUES(name_en), weight_grams=VALUES(weight_grams), purity=VALUES(purity), specifications_ar=VALUES(specifications_ar), specifications_en=VALUES(specifications_en), active=VALUES(active)",
          [crypto.randomUUID(), r.serial, r.name_ar, r.name_en, r.weight_grams, r.purity, r.specifications_ar, r.specifications_en, r.active ? 1 : 0],
        );
      await conn.commit();
    } catch {
      await conn.rollback();
      throw new Error("تعذر حفظ السيريالات؛ لم يتم استيراد الملف");
    } finally { conn.release(); }
    return { count: data.length };
  });
