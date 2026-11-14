import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLang, pick } from "@/lib/i18n";
import { productsQuery, productGroupsQuery, productCategoriesQuery } from "@/lib/data";
import { matchesProductCategory } from "@/lib/product-categories";
import { Button } from "@/components/ui/button";
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
  const { t, lang } = useLang();
  const products = useQuery(productsQuery);
  const groups = useQuery(productGroupsQuery);
  const categories = useQuery(productCategoriesQuery);
  const [selectedGroup, setGroup] = useState("");
  const [selectedCategory, setCategory] = useState("");
  const groupId = groups.data?.some((group) => group.id === selectedGroup) ? selectedGroup : "";
  const categoryId = categories.data?.some(
    (category) => category.id === selectedCategory && category.group_id === groupId,
  )
    ? selectedCategory
    : "";
  const branches = (categories.data ?? []).filter((category) => category.group_id === groupId);
  const visible = (products.data ?? []).filter(
    (product) =>
      product.active && matchesProductCategory(product, categories.data ?? [], groupId, categoryId),
  );
  const loading = products.isLoading || groups.isLoading || categories.isLoading;
  const error = products.error || groups.error || categories.error;
  return (
    <main>
      <PageHero title={t("products")} />
      <section className="mx-auto max-w-7xl px-4 py-10">
        <nav
          aria-label={lang === "ar" ? "أقسام المنتجات" : "Product groups"}
          className="mb-4 flex flex-wrap gap-2 border-b border-border pb-4"
        >
          <Button
            variant={!groupId ? "default" : "outline"}
            aria-pressed={!groupId}
            onClick={() => {
              setGroup("");
              setCategory("");
            }}
          >
            {t("viewAll")}
          </Button>
          {groups.data?.map((group) => (
            <Button
              key={group.id}
              variant={groupId === group.id ? "default" : "outline"}
              aria-pressed={groupId === group.id}
              onClick={() => {
                setGroup(group.id);
                setCategory("");
              }}
            >
              {pick(group, "name", lang)}
            </Button>
          ))}
        </nav>
        {groupId && (
          <nav
            aria-label={lang === "ar" ? "الأقسام الفرعية" : "Subcategories"}
            className="mb-8 flex flex-wrap gap-2"
          >
            <Button
              variant={!categoryId ? "secondary" : "ghost"}
              aria-pressed={!categoryId}
              onClick={() => setCategory("")}
            >
              {t("viewAll")}
            </Button>
            {branches.map((category) => (
              <Button
                key={category.id}
                variant={categoryId === category.id ? "secondary" : "ghost"}
                aria-pressed={categoryId === category.id}
                onClick={() => setCategory(category.id)}
              >
                {pick(category, "name", lang)}
              </Button>
            ))}
          </nav>
        )}
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">
            {lang === "ar" ? "جارٍ تحميل المنتجات…" : "Loading products…"}
          </p>
        ) : error ? (
          <p role="alert" className="py-12 text-center text-destructive">
            {lang === "ar" ? "تعذر تحميل المنتجات" : "Unable to load products"}
          </p>
        ) : visible.length ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((p, i) => (
              <ProductCard key={p.id} p={p} idx={i} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-muted-foreground">
            {lang === "ar"
              ? "لا توجد منتجات في هذا القسم حاليًا"
              : "No products in this category yet"}
          </p>
        )}
      </section>
    </main>
  );
}
