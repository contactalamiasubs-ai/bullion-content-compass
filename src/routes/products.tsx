import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { PageHero } from "@/components/site";
import { ProductCatalog } from "@/components/product-catalog";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "منتجاتنا | جولد سنتر" },
      { name: "description", content: "سبائك ذهب وجنيهات ومشغولات، اطلبها مباشرة عبر واتساب." },
      { property: "og:title", content: "منتجاتنا | جولد سنتر" },
      { property: "og:description", content: "سبائك ذهب وجنيهات ومشغولات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Products,
});

function Products() {
  const { t } = useLang();
  return (
    <main>
      <PageHero title={t("products")} />
      <section className="mx-auto max-w-7xl px-4 py-10">
        <ProductCatalog />
      </section>
    </main>
  );
}
