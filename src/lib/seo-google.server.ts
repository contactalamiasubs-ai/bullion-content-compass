import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import { SEO_ORIGIN } from "@/lib/seo";
export type SiteEntry = { siteUrl: string; permissionLevel?: string };
export class GoogleRequestError extends Error {
  constructor(message: string, public status: number, public retryAt: string | null = null) { super(message); }
}
export function coversTarget(siteUrl: string, target: string) {
  const url = new URL(target);
  if (siteUrl.startsWith("sc-domain:")) { const domain = siteUrl.slice(10).toLowerCase(); return url.hostname === domain || url.hostname.endsWith(`.${domain}`); }
  try { return url.href.startsWith(new URL(siteUrl).href); } catch { return false; }
}
export async function googleCall(path: string, method = "GET", body?: object) {
  const key = process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"], api = process.env["LOVABLE_API_KEY"];
  if (!key || !api) throw new Error("Search Console غير متصل على هذه الاستضافة");
  const response = await fetch(`https://connector-gateway.lovable.dev/google_search_console${path}`, { method, headers: { Authorization: `Bearer ${api}`, "X-Connection-Api-Key": key, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  if (!response.ok) { const error = await response.text(); console.error(`Search Console [${response.status}]: ${error}`);
    const wait = response.headers.get("Retry-After"); const seconds = wait ? Number(wait) : NaN;
    const retry = Number.isFinite(seconds) ? Date.now()+Math.max(0,seconds)*1000 : Date.parse(wait ?? "");
    const retryAt = response.status===429 ? new Date(Number.isFinite(retry)?retry:Date.now()+3600000).toISOString() : null;
    throw new GoogleRequestError(`Google [${response.status}]: ${error}`,response.status,retryAt);
  }
  const text = await response.text(); return text ? JSON.parse(text) as Json : null;
}
export async function matchingSites() {
  const response = await googleCall("/webmasters/v3/sites") as { siteEntry?: SiteEntry[] } | null;
  return (response?.siteEntry ?? []).filter(s => s.permissionLevel !== "siteUnverifiedUser" && coversTarget(s.siteUrl, `${SEO_ORIGIN}/`));
}
export type SearchRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
export type SearchSnapshot = { totals: SearchRow | null; queries: SearchRow[]; pages: SearchRow[]; startDate: string; endDate: string; siteUrl: string };
export async function refreshSearchSnapshot(client: SupabaseClient<Database>, selected?: string) {
  const matches = await matchingSites();
  if (!matches.length) return { status: "verification_required" as const, candidates: [] as string[] };
  if (!selected && matches.length > 1) return { status: "selection_required" as const, candidates: matches.map(s => s.siteUrl) };
  const property = selected ? matches.find(s => s.siteUrl === selected) : matches[0];
  if (!property) throw new Error("الخاصية المختارة غير موثقة لهذا الموقع");
  const end = new Date(); end.setUTCDate(end.getUTCDate() - 1); const start = new Date(end); start.setUTCDate(start.getUTCDate() - 27);
  const endDate = end.toISOString().slice(0,10), startDate = start.toISOString().slice(0,10);
  const query = async (dimensions: string[]) => (await googleCall(`/webmasters/v3/sites/${encodeURIComponent(property.siteUrl)}/searchAnalytics/query`, "POST", { startDate, endDate, dimensions, rowLimit: 1000 }) as { rows?: SearchRow[] } | null)?.rows ?? [];
  // Sequential calls stop immediately on an access/quota failure rather than continuing a batch.
  const totals = await query([]); const queries = await query(["query"]); const pages = await query(["page"]);
  const snapshot: SearchSnapshot = { totals: totals[0] ?? null, queries, pages, startDate, endDate, siteUrl: property.siteUrl };
  const saved = await client.from("seo_reports").upsert({ provider: "search_console", selected_property: property.siteUrl, snapshot: snapshot as unknown as Json, refreshed_at: new Date().toISOString(), error: "" });
  if (saved.error) throw new Error(saved.error.message);
  return { status: "ok" as const, candidates: [] as string[], snapshot };
}