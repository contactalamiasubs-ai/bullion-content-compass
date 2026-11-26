import type { AdminContext } from "@/lib/admin-users.server";
import { SEO_ORIGIN } from "@/lib/seo";
import { AdminBridgeError } from "@/lib/admin-bridge";
import { googleCall, matchingSites, refreshSearchSnapshot } from "@/lib/seo-google.server";
import type { SeoGoogleCommand } from "@/lib/seo-google-bridge";

export async function assertSeoPermission(context: AdminContext) {
  const permitted = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" });
  if (!permitted.data || permitted.error) throw new AdminBridgeError("غير مسموح بإدارة SEO.",403);
}
export async function refreshGoogle(context: AdminContext, siteUrl?: string) {
  const saved = await context.supabase.from("seo_reports").select("selected_property").eq("provider","search_console").maybeSingle();
  if (saved.error) throw new Error(saved.error.message);
  const result = await refreshSearchSnapshot(context.supabase,siteUrl || saved.data?.selected_property || undefined);
  if (result.status==="ok") {
    const unblocked = await context.supabase.from("seo_sync_state").upsert({id:1,blocked:false,retry_at:null});
    if (unblocked.error) throw new Error(unblocked.error.message);
  }
  return result;
}
export async function inspectGoogle(context: AdminContext, path: string) {
  const matches = await matchingSites(); const selected = await context.supabase.from("seo_reports").select("selected_property").eq("provider","search_console").maybeSingle();
  if (selected.error) throw new Error(selected.error.message);
  const site = matches.find(s => s.siteUrl === selected.data?.selected_property);
  if (!site) return { status: "selection_required", result: null };
  const result = await googleCall("/v1/urlInspection/index:inspect", "POST", { siteUrl: site.siteUrl, inspectionUrl: SEO_ORIGIN + path });
  return { status: "ok", result };
}
export async function verifyGoogle(context: AdminContext) {
  const config = await context.supabase.from("seo_config").select("google_verification").eq("id",1).single();
  if (config.error) throw new Error(config.error.message);
  const token = config.data.google_verification;
  if (!token) throw new Error("أضف وسم إثبات الملكية أولًا");
  const root = await fetch(`${SEO_ORIGIN}/`, { redirect: "manual", signal: AbortSignal.timeout(15000) });
  const html = await root.text(); const { parseHTML } = await import("linkedom");
  if (!root.ok || ![...parseHTML(html).document.querySelectorAll('meta[name="google-site-verification"]')].some(tag => tag.getAttribute("content") === token)) return { status: "publish_required" as const };
  const xml = await fetch(`${SEO_ORIGIN}/sitemap.xml`, { redirect: "manual", signal: AbortSignal.timeout(15000) }); const text = await xml.text();
  const locations = [...parseHTML(text).document.querySelectorAll("loc")].map(loc=>loc.textContent ?? "");
  if (!xml.ok || !text.includes("<urlset") || !locations.some(loc=>{ try { return new URL(loc).origin===SEO_ORIGIN; } catch { return false; } })) return { status: "sitemap_required" as const };
  await googleCall("/siteVerification/v1/webResource?verificationMethod=META", "POST", { site: { identifier: `${SEO_ORIGIN}/`, type: "SITE" } });
  await googleCall(`/webmasters/v3/sites/${encodeURIComponent(`${SEO_ORIGIN}/`)}`, "PUT");
  const sites = await matchingSites(); const site = sites.find(s => s.siteUrl === `${SEO_ORIGIN}/`);
  if (!site) throw new Error("الموقع الموثق لم يظهر في قائمة Google");
  await googleCall(`/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/sitemaps/${encodeURIComponent(`${SEO_ORIGIN}/sitemap.xml`)}`, "PUT");
  const saved = await context.supabase.from("seo_reports").upsert({ provider: "search_console", selected_property: site.siteUrl, error: "" }); if (saved.error) throw new Error(saved.error.message);
  const digest = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));
  const sitemap_hash = [...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,"0")).join("");
  const state = await context.supabase.from("seo_sync_state").upsert({id:1,sitemap_hash,submitted_at:new Date().toISOString(),blocked:false,retry_at:null});
  if (state.error) throw new Error(state.error.message);
  return { status: "verified" as const };
}
export function googleStatus() { return { searchConsoleConnected: Boolean(process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"] && process.env["LOVABLE_API_KEY"]), analyticsConnected: Boolean(process.env["GOOGLE_ANALYTICS_API_KEY"] && process.env["LOVABLE_API_KEY"]) }; }
export async function executeGoogleCommand(command: SeoGoogleCommand,context: AdminContext) {
  await assertSeoPermission(context);
  switch(command.action) {
    case "refresh": return refreshGoogle(context,command.siteUrl);
    case "inspect": return inspectGoogle(context,command.path);
    case "verify": return verifyGoogle(context);
    case "status": return googleStatus();
  }
}