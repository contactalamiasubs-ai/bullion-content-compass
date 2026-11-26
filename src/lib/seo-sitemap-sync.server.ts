import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { SEO_ORIGIN } from "@/lib/seo";
import { googleCall, matchingSites } from "@/lib/seo-google.server";
export async function syncSeoSitemap(client: SupabaseClient<Database>, selected: string) {
  const matches = await matchingSites();
  const site = matches.find(entry=>entry.siteUrl===selected);
  if (!site) return "paused_until_setup";
  const response = await fetch(`${SEO_ORIGIN}/sitemap.xml`, {redirect:"manual",signal:AbortSignal.timeout(15000)});
  const xml = await response.text();
  if (!response.ok || !xml.includes("<urlset") || !xml.includes(`<loc>${SEO_ORIGIN}/`)) return "sitemap_not_live";
  const digest = await crypto.subtle.digest("SHA-256",new TextEncoder().encode(xml));
  const hash = [...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,"0")).join("");
  const stored = await client.from("seo_sync_state").select("sitemap_hash").eq("id",1).maybeSingle();
  if (stored.error) throw new Error(stored.error.message);
  const path = `/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/sitemaps/${encodeURIComponent(`${SEO_ORIGIN}/sitemap.xml`)}`;
  if (stored.data?.sitemap_hash!==hash) {
    await googleCall(path,"PUT");
    const saved = await client.from("seo_sync_state").upsert({id:1,sitemap_hash:hash,submitted_at:new Date().toISOString()});
    if (saved.error) throw new Error(saved.error.message);
  }
  const status = await googleCall(path);
  const saved = await client.from("seo_sync_state").upsert({id:1,sitemap_status:status as Json});
  if (saved.error) throw new Error(saved.error.message);
  return "ok";
}