import { createServerFn } from "@tanstack/react-start";
import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { buildSeo, type SiteBundle } from "@/lib/seo";

export const getSeoBundle = createServerFn({ method: "GET" }).handler(async () => {
  const { readPublicBundle } = await import("@/lib/seo-public.server");
  return readPublicBundle();
});
export const seoBundleQuery = queryOptions({ queryKey: ["seo-bundle"], queryFn: () => getSeoBundle(), staleTime: 30000 });
export function seedPublicQueries(qc: QueryClient, b: SiteBundle) {
  const sorted = <T extends { sort: number }>(rows: T[]) => [...rows].sort((a, c) => a.sort - c.sort);
  qc.setQueryData(["settings"], b.settings); qc.setQueryData(["sections"], Object.fromEntries(b.sections.map(s => [s.key, s])));
  qc.setQueryData(["products"], sorted(b.products)); qc.setQueryData(["services"], sorted(b.services)); qc.setQueryData(["slides"], sorted(b.slides)); qc.setQueryData(["product-groups"], sorted(b.groups)); qc.setQueryData(["product-categories"], sorted(b.categories)); qc.setQueryData(["prices"], sorted(b.prices)); qc.setQueryData(["history"], [...b.history].sort((a,c) => a.day.localeCompare(c.day)));
  qc.setQueryData(["posts", "all"], b.posts); qc.setQueryData(["posts", "blog"], b.posts.filter(p => p.kind === "blog")); qc.setQueryData(["posts", "news"], b.posts.filter(p => p.kind === "news"));
  for (const p of b.products) qc.setQueryData(["products", p.id], p);
  for (const p of b.posts) qc.setQueryData(["post", p.slug], p);
}
export async function loadPublicPage(qc: QueryClient, path: string, lang: "ar" | "en" = "ar") {
  const b = await qc.ensureQueryData(seoBundleQuery); seedPublicQueries(qc, b);
  return { seo: buildSeo(b, path, lang), bundle: b };
}