import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const externalConnectionsStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const allowed = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (allowed.error || !allowed.data) throw new Error("هذه الإعدادات متاحة للمسؤول الكامل فقط.");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("تعذر قراءة إعدادات تسجيل الدخول على هذه الاستضافة.");
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("تعذر فحص إعدادات تسجيل الدخول؛ حاول مرة أخرى.");
    const settings = await response.json() as { external?: { google?: boolean } };
    // Return capability flags only, never credentials or provider configuration records.
    return {
      googleEnabled: settings.external?.google === true,
      aiConfigured: !!process.env["LOVABLE_API_KEY"],
      hostedBridgeConfigured: !!process.env["HOSTED_ADMIN_BRIDGE_URL"],
    };
  });