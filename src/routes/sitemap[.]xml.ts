import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import { sitemapStaticPaths, sitemapPathForLocation, isSitemapRouteIncluded, sitemapXML, type SitemapEntry } from "@/lib/sitemap";
import { SEO_ORIGIN, findSeoPage, pagePath } from "@/lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: { handlers: { GET: async () => {
    try {
      const { readPublicBundle } = await import("@/lib/seo-public.server");
      const b = await readPublicBundle(); const router = await getRouterInstance();
      const entries: SitemapEntry[] = sitemapStaticPaths(router).filter(path => findSeoPage(b,path)?.robots !== "noindex").map(path => ({ path }));
      for (const page of b.seo) {
        if (page.entity_type === "page" || page.robots === "noindex") continue;
        const id = page.url_slug || (page.entity_type === "posts" ? b.posts.find(p => p.id === page.entity_id)?.slug : page.entity_id);
        if (!id) continue;
        if (page.entity_type === "products" && !b.products.some(p => p.id === page.entity_id)) continue;
        if (page.entity_type === "posts" && !b.posts.some(p => p.id === page.entity_id)) continue;
        const to = page.entity_type === "products" ? "/products/$id" : page.entity_type === "posts" ? "/posts/$slug" : page.entity_type === "services" ? "/services/$id" : page.entity_type === "product_groups" ? "/groups/$id" : "/categories/$id";
        const routeId = to === "/products/$id" ? "/products_/$id" : to === "/services/$id" ? "/services_/$id" : to;
        if (!isSitemapRouteIncluded(router.routesById[routeId])) continue;
        const location = router.buildLocation({ to, params: { id, slug: id }, search: () => ({}), hash: "" });
        const path = sitemapPathForLocation(router, location, routeId);
        if (path && (!page.canonical_url || page.canonical_url === SEO_ORIGIN + pagePath(page))) entries.push({ path });
      }
      return new Response(sitemapXML(SEO_ORIGIN, entries), { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=60" } });
    } catch (error) {
      console.error("Sitemap unavailable", error);
      return new Response("Sitemap unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  } } },
});