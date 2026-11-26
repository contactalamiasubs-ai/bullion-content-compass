import type { AnyRoute, AnyRouter, ParsedLocation } from "@tanstack/react-router";
declare module "@tanstack/react-router" { interface StaticDataRouteOption { sitemap: boolean | "exclude-subtree" } }
export const sitemapRouteInventoryVersion = 1;
type RouteMatch = { routeParams: Record<string, unknown>; foundRoute?: AnyRoute; parseError?: unknown } | [AnyRoute[], Record<string, unknown>, AnyRoute | undefined];
export function isSitemapRouteIncluded(route: AnyRoute | undefined): boolean {
  if (!route || route.isRoot || route.options.staticData?.sitemap !== true) return false;
  for (let ancestor = route.parentRoute; ancestor; ancestor = ancestor.parentRoute) if (ancestor.options.staticData?.sitemap === "exclude-subtree") return false;
  return true;
}
function safePath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || /[?#\\]/.test(path)) return false;
  try { return decodeURI(new URL(path, "https://sitemap.invalid").pathname) === decodeURI(path); } catch { return false; }
}
export function sitemapPathForLocation(router: AnyRouter, location: Pick<ParsedLocation, "pathname" | "publicHref">, routeId: string) {
  if (!safePath(location.pathname) || !safePath(location.publicHref)) return undefined;
  const result = router.getMatchedRoutes(location.pathname) as RouteMatch;
  const [params, found] = Array.isArray(result) ? [result[1], result[2]] : [result.routeParams, result.parseError ? undefined : result.foundRoute];
  return params["**"] === undefined && found?.id === routeId && isSitemapRouteIncluded(found) ? location.publicHref : undefined;
}
export function sitemapStaticPaths(router: AnyRouter) {
  const paths = new Set<string>();
  for (const route of Object.values(router.routesById) as AnyRoute[]) {
    if (!isSitemapRouteIncluded(route) || /[$*]/.test(route.fullPath)) continue;
    const path = sitemapPathForLocation(router, router.buildLocation({ to: route.fullPath }), route.id);
    if (path !== undefined) paths.add(path);
  }
  return [...paths].sort();
}
export interface SitemapEntry { path: string; lastmod?: string }
export function sitemapXML(baseURL: string, entries: SitemapEntry[]) {
  const origin = new URL(baseURL);
  if (!/^https?:$/.test(origin.protocol) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) throw new Error("Invalid sitemap origin");
  const escape = (v: string) => v.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] ?? c);
  const seen = new Set<string>(); const urls: string[] = [];
  for (const entry of entries) {
    if (!safePath(entry.path)) throw new Error("Invalid sitemap path");
    const url = new URL(entry.path, origin); if (seen.has(url.href)) continue; seen.add(url.href);
    urls.push(`<url><loc>${escape(url.href)}</loc>${entry.lastmod ? `<lastmod>${escape(entry.lastmod)}</lastmod>` : ""}</url>`);
    urls.push(`<url><loc>${escape(url.href)}?lang=en</loc>${entry.lastmod ? `<lastmod>${escape(entry.lastmod)}</lastmod>` : ""}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
}