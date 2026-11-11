import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { productsQuery } from "@/lib/data";
import { PageHero, ProductCard } from "@/components/site";

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
  const { data = [] } = useQuery(productsQuery);
  return (
    <main>
      <PageHero title={t("products")} />
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-4 py-12 md:grid-cols-3 lg:grid-cols-4">
        {data
          .filter((p) => p.active)
          .map((p, i) => (
            <ProductCard key={p.id} p={p} idx={i} />
          ))}
      </section>
    </main>
  );
}
