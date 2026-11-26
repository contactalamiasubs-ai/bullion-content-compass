import { loadPublicPage } from "@/lib/seo-public.functions";
import { seoHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { PageHero } from "@/components/site";
import { ProductCatalog } from "@/components/product-catalog";
import { catalogSearch } from "@/lib/catalog-pagination";

export const Route = createFileRoute("/products")({
  staticData: { sitemap: true },
  validateSearch: catalogSearch,
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: ({ context, deps }) => loadPublicPage(context.queryClient, "/products", deps.lang),
  head: ({ loaderData }) => seoHead(loaderData?.seo),
  component: Products,
});

function Products() {
  const { t } = useLang();
  return (
    <main>
      <PageHero title={t("products")} centered />
      <section className="mx-auto max-w-7xl px-4 py-10">
        <ProductCatalog />
      </section>
    </main>
  );
}
