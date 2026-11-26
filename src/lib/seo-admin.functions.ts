import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { SEO_ORIGIN, publicPathSchema, buildSeo } from "@/lib/seo";
import { auditObservation } from "@/lib/seo-audit";
import type { Json } from "@/integrations/supabase/types";

export const runSeoAudit = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator(z.object({ path: publicPathSchema })).handler(async ({ context, data }) => {
  const permitted = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" });
  if (permitted.error || !permitted.data) throw new Error("غير مسموح بإدارة SEO");
  const { readPublicBundle } = await import("@/lib/seo-public.server");
  const bundle = await readPublicBundle(); const expected = buildSeo(bundle, data.path);
  const request = new URL(getRequest().url); const origin = request.hostname === "localhost" ? request.origin : SEO_ORIGIN;
  async function fetchLocal(path: string) {
    let target = new URL(path, origin);
    for (let hop = 0; hop < 8; hop++) {
      if (target.origin !== origin || !publicPathSchema.safeParse(target.pathname).success) throw new Error("External audit target rejected");
      const response = await fetch(target.href, { redirect: "manual", signal: AbortSignal.timeout(15000) });
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) { const next = new URL(location, target); if (next.origin === SEO_ORIGIN) next.host = new URL(origin).host; next.protocol = new URL(origin).protocol; target = next; continue; }
      return response;
    }
    throw new Error("Too many redirects");
  }
  const response = await fetchLocal(data.path); const html = await response.text();
  if (html.length > 5_000_000) throw new Error("Page too large to inspect");
  const { parseHTML } = await import("linkedom"); const { document } = parseHTML(html);
  const title = document.querySelector("title")?.textContent ?? "";
  const description = document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "";
  const canonicals = [...document.querySelectorAll('link[rel="canonical"]')];
  const canonical = canonicals.length === 1 ? canonicals[0]?.getAttribute("href") ?? "" : "";
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]; let schemaCount = 0, invalidSchemas = 0;
  for (const script of scripts) {
    try {
      const parsed: unknown = JSON.parse(script.textContent ?? ""); const rows = Array.isArray(parsed) ? parsed : [parsed];
      for (const row of rows) { if (!row || typeof row !== "object" || !("@type" in row) || !("@context" in row)) invalidSchemas++; else schemaCount++; }
    } catch { invalidSchemas++; }
  }
  const main = document.querySelector("main") ?? document.body;
  const images = [...main.querySelectorAll("img")]; const links = new Set<string>();
  for (const a of document.querySelectorAll("a[href]")) {
    try { const url = new URL(a.getAttribute("href") ?? "", origin); if ((url.origin === origin || url.origin === SEO_ORIGIN) && publicPathSchema.safeParse(url.pathname).success) links.add(url.pathname); } catch { /* not a URL */ }
  }
  const brokenLinks: string[] = [], failedLinks: string[] = [];
  const list = [...links];
  for (let start = 0; start < list.length; start += 5) await Promise.all(list.slice(start,start + 5).map(async path => {
    try { const r = await fetchLocal(path); if (r.status >= 400) brokenLinks.push(`${path} (${r.status})`); await r.body?.cancel(); } catch { failedLinks.push(path); }
  }));
  const report = auditObservation({ status: response.status, title, description, canonical, expectedCanonical: expected.canonical, schemaCount, invalidSchemas, h1Count: main.querySelectorAll("h1").length, missingAlts: images.filter(i => !i.hasAttribute("alt") || (!i.getAttribute("alt") && !i.closest('[aria-hidden="true"]') && !i.classList.contains("serial-bg-image"))).length, wordCount: (main.textContent ?? "").trim().split(/\s+/).filter(Boolean).length, brokenLinks, failedLinks, pageType: data.path, imageCount: images.length });
  const checked_at = new Date().toISOString();
  const saved = await context.supabase.from("seo_audits").upsert({ path: data.path, score: report.score, report: report as unknown as Json, checked_at });
  if (saved.error) throw new Error(saved.error.message);
  return { ...report, checked_at, path: data.path };
});

export const checkSeoTechnical = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const permission = await context.supabase.rpc("has_dashboard_permission", { _user_id: context.userId, _permission: "seo" }); if (!permission.data || permission.error) throw new Error("Forbidden");
  const request = new URL(getRequest().url), origin = request.hostname === "localhost" ? request.origin : SEO_ORIGIN;
  const results = await Promise.all(["/sitemap.xml", "/robots.txt"].map(async path => {
    try { const response = await fetch(origin + path, { redirect: "manual", signal: AbortSignal.timeout(15000) }); const text = await response.text();
      const valid = response.ok && (path === "/sitemap.xml" ? text.includes("<urlset") && text.includes(`${SEO_ORIGIN}/`) && !text.includes(`${SEO_ORIGIN}/admin`) : text.includes(`Sitemap: ${SEO_ORIGIN}/sitemap.xml`) && !/Disallow:\s*\/\s*($|\n)/m.test(text));
      return { path, status: response.status, valid, checkedAt: new Date().toISOString() };
    } catch { return { path, status: 0, valid: false, checkedAt: new Date().toISOString() }; }
  }));
  return { origin, results };
});