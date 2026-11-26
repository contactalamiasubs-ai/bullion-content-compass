import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { publicPathSchema } from "@/lib/seo";
import { forwardSeoGoogle, type SeoGoogleCommand } from "@/lib/seo-google-bridge";
import { adminBridgeUrl } from "@/lib/admin-bridge";

async function remote<T>(command: SeoGoogleCommand): Promise<T | undefined> {
  const bridge = process.env["HOSTED_ADMIN_BRIDGE_URL"];
  if (!bridge) return undefined;
  if (bridge !== adminBridgeUrl) throw new Error("رابط الاستضافة غير معتمد.");
  const { getRequest } = await import("@tanstack/react-start/server");
  return forwardSeoGoogle<T>(getRequest().headers.get("authorization"),command);
}

export const refreshSeoGoogle = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ siteUrl: z.string().max(300).optional() })).handler(async ({ context, data }) => {
  const permitted = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" }); if (!permitted.data || permitted.error) throw new Error("Forbidden");
  const { refreshGoogle } = await import("@/lib/seo-google-actions.server");
  const relayed = await remote<Awaited<ReturnType<typeof refreshGoogle>>>({action:"refresh",...data});
  return relayed ?? refreshGoogle(context,data.siteUrl);
});
export const inspectSeoUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ path: publicPathSchema })).handler(async ({ context, data }) => {
  const permitted = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" }); if (!permitted.data || permitted.error) throw new Error("Forbidden");
  const { inspectGoogle } = await import("@/lib/seo-google-actions.server");
  const relayed = await remote<Awaited<ReturnType<typeof inspectGoogle>>>({action:"inspect",path:data.path});
  return relayed ?? inspectGoogle(context,data.path);
});
export const verifySeoGoogle = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const permitted = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" }); if (!permitted.data || permitted.error) throw new Error("Forbidden");
  const { verifyGoogle } = await import("@/lib/seo-google-actions.server");
  const relayed = await remote<Awaited<ReturnType<typeof verifyGoogle>>>({action:"verify"});
  return relayed ?? verifyGoogle(context);
});
export const seoGoogleStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const allowed = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" }); if (!allowed.data || allowed.error) throw new Error("Forbidden");
  const { googleStatus } = await import("@/lib/seo-google-actions.server");
  const relayed = await remote<ReturnType<typeof googleStatus>>({action:"status"});
  return relayed ?? googleStatus();
});