import { createFileRoute, notFound } from "@tanstack/react-router";
import { loadPublicPage } from "@/lib/seo-public.functions";
import { seoHead } from "@/lib/seo";
import { SeoEntityPage } from "@/components/seo-entity-page";
export const Route = createFileRoute("/categories/$id")({ staticData: { sitemap: true },
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: async ({ params, context, deps }) => { const result = await loadPublicPage(context.queryClient, `/categories/${params.id}`, deps.lang); if (!result.seo.exists) throw notFound(); return result; },
  head: ({ loaderData }) => seoHead(loaderData?.seo), component: Page,
});
function Page() { const data = Route.useLoaderData(); return <SeoEntityPage bundle={data.bundle} path={`/categories/${Route.useParams().id}`} />; }