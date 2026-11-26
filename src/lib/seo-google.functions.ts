import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { SEO_ORIGIN, publicPathSchema } from "@/lib/seo";

export const refreshSeoGoogle = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ siteUrl: z.string().max(300).optional() })).handler(async ({ context, data }) => {
  const permitted = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" }); if (!permitted.data || permitted.error) throw new Error("Forbidden");
  const { refreshSearchSnapshot } = await import("@/lib/seo-google.server");
  const saved = await context.supabase.from("seo_reports").select("selected_property").eq("provider","search_console").maybeSingle();
  if (saved.error) throw new Error(saved.error.message);
  return refreshSearchSnapshot(context.supabase, data.siteUrl || saved.data?.selected_property || undefined);
});
export const inspectSeoUrl = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ path: publicPathSchema })).handler(async ({ context, data }) => {
  const permitted = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" }); if (!permitted.data || permitted.error) throw new Error("Forbidden");
  const { matchingSites, googleCall } = await import("@/lib/seo-google.server");
  const matches = await matchingSites(); const selected = await context.supabase.from("seo_reports").select("selected_property").eq("provider","search_console").maybeSingle();
  if (selected.error) throw new Error(selected.error.message);
  const site = matches.find(s => s.siteUrl === selected.data?.selected_property);
  if (!site) return { status: "selection_required", result: null };
  const result = await googleCall("/v1/urlInspection/index:inspect", "POST", { siteUrl: site.siteUrl, inspectionUrl: SEO_ORIGIN + data.path });
  return { status: "ok", result };
});
export const verifySeoGoogle = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const permitted = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" }); if (!permitted.data || permitted.error) throw new Error("Forbidden");
  const config = await context.supabase.from("seo_config").select("google_verification").eq("id",1).single();
  if (config.error) throw new Error(config.error.message);
  const token = config.data.google_verification;
  if (!token) throw new Error("أضف وسم إثبات الملكية أولًا");
  const root = await fetch(`${SEO_ORIGIN}/`, { redirect: "manual", signal: AbortSignal.timeout(15000) });
  const html = await root.text(); const { parseHTML } = await import("linkedom");
  if (!root.ok || ![...parseHTML(html).document.querySelectorAll('meta[name="google-site-verification"]')].some(tag => tag.getAttribute("content") === token)) return { status: "publish_required" as const };
  const xml = await fetch(`${SEO_ORIGIN}/sitemap.xml`, { redirect: "manual", signal: AbortSignal.timeout(15000) }); const text = await xml.text();
  if (!xml.ok || !text.includes(`${SEO_ORIGIN}/`) || !text.includes("<loc>")) return { status: "sitemap_required" as const };
  const { googleCall, matchingSites } = await import("@/lib/seo-google.server");
  await googleCall("/siteVerification/v1/webResource?verificationMethod=META", "POST", { site: { identifier: `${SEO_ORIGIN}/`, type: "SITE" } });
  await googleCall(`/webmasters/v3/sites/${encodeURIComponent(`${SEO_ORIGIN}/`)}`, "PUT");
  const sites = await matchingSites(); const site = sites.find(s => s.siteUrl === `${SEO_ORIGIN}/`);
  if (!site) throw new Error("الموقع الموثق لم يظهر في قائمة Google");
  await googleCall(`/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/sitemaps/${encodeURIComponent(`${SEO_ORIGIN}/sitemap.xml`)}`, "PUT");
  const saved = await context.supabase.from("seo_reports").upsert({ provider: "search_console", selected_property: site.siteUrl, error: "" }); if (saved.error) throw new Error(saved.error.message);
  return { status: "verified" as const };
});
export const seoGoogleStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const allowed = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" }); if (!allowed.data || allowed.error) throw new Error("Forbidden");
  return { searchConsoleConnected: Boolean(process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"] && process.env["LOVABLE_API_KEY"]), analyticsConnected: Boolean(process.env["GOOGLE_ANALYTICS_API_KEY"] && process.env["LOVABLE_API_KEY"]) };
});