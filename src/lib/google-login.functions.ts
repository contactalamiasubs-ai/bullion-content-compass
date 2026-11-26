import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const googleLoginSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("google_login_status");
    if (error) throw new Error("هذه الإعدادات متاحة للمسؤول الكامل فقط.");
    const row = data?.[0];
    return { clientId: row?.client_id ?? "", hasSecret: !!row?.has_secret, enabled: !!row?.enabled };
  });

export const saveGoogleLoginSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    clientId: z.string().trim().regex(/^[0-9A-Za-z_-]+\.apps\.googleusercontent\.com$/, "Client ID يجب أن ينتهي بـ .apps.googleusercontent.com").max(200),
    clientSecret: z.string().trim().max(200).regex(/^\S*$/, "Client Secret غير صحيح"),
    enabled: z.boolean(),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("save_google_login", { _client_id: data.clientId, _client_secret: data.clientSecret, _enabled: data.enabled });
    if (error) throw new Error(error.message.includes("forbidden") ? "هذه الإعدادات متاحة للمسؤول الكامل فقط." : "تعذر حفظ المفاتيح؛ تأكد من صحتها.");
    return { success: true };
  });
