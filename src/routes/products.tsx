import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Coins, Gift, Gem, LayoutGrid, Layers3 } from "lucide-react";
import { useLang, pick } from "@/lib/i18n";
import { productsQuery, productGroupsQuery, productCategoriesQuery } from "@/lib/data";
import { matchesProductCategory } from "@/lib/product-categories";
import { Button } from "@/components/ui/button";
import { PageHero, ProductCard } from "@/components/site";
import { ProductAssistant } from "@/components/product-assistant";

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

function CategoryIcon({ name, main = false }: { name: string; main?: boolean }) {
  const normalized = name.trim().toLowerCase();
  const size = main ? "size-8" : "size-5";
  if (/سبائك|bars|bullion/.test(normalized)) {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        aria-hidden="true"
        className={size}
      >
        <path d="m6 17 3-7h14l3 7v6H6z" fill="currentColor" fillOpacity="0.12" />
        <path d="M6 17h20M9 10l3 7m11-7-3 7M12 17v6m8-6v6M13 13h6" />
        <path d="m3 24 2 4h22l2-4" />
      </svg>
    );
  }
  if (/عملات|coins/.test(normalized))
    return <Coins aria-hidden="true" className={size} strokeWidth={1.5} />;
  if (/هدايا|gifts/.test(normalized))
    return <Gift aria-hidden="true" className={size} strokeWidth={1.5} />;
  if (/فضة|الفضة|silver/.test(normalized))
    return <Layers3 aria-hidden="true" className={size} strokeWidth={1.5} />;
  return <Gem aria-hidden="true" className={size} strokeWidth={1.5} />;
}

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
        <ProductAssistant />
        <nav
          aria-label={lang === "ar" ? "أقسام المنتجات" : "Product groups"}
          className="mb-5 flex flex-wrap gap-3 border-b border-border pb-6"
        >
          <Button
            variant="ghost"
            className={`group h-auto min-h-28 min-w-24 flex-col gap-3 rounded-lg px-5 py-3 transition-colors sm:min-w-32 [&_svg]:size-8 ${!groupId ? "bg-accent text-gold" : "text-muted-foreground hover:text-gold"}`}
            aria-pressed={!groupId}
            onClick={() => {
              setGroup("");
              setCategory("");
            }}
          >
            <span className="grid size-14 shrink-0 place-items-center rounded-full border border-current/25 bg-current/5">
              <LayoutGrid aria-hidden="true" className="size-7" strokeWidth={1.5} />
            </span>
            {t("viewAll")}
          </Button>
          {groups.data?.map((group) => (
            <Button
              key={group.id}
              variant="ghost"
              className={`group h-auto min-h-28 min-w-24 flex-col gap-3 rounded-lg px-5 py-3 transition-colors sm:min-w-32 [&_svg]:size-8 ${groupId === group.id ? "bg-accent" : "hover:bg-accent/50"} ${/فضة|الفضة|silver/i.test(`${group.name_ar} ${group.name_en}`) ? "text-silver" : "text-gold"}`}
              aria-pressed={groupId === group.id}
              onClick={() => {
                setGroup(group.id);
                setCategory("");
              }}
            >
              <span className="grid size-14 shrink-0 place-items-center rounded-full border border-current/25 bg-current/5 transition-transform motion-safe:group-hover:-translate-y-1">
                <CategoryIcon name={`${group.name_ar} ${group.name_en}`} main />
              </span>
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
              className="min-h-12 gap-2.5 px-3 [&_svg]:size-5"
            >
              <LayoutGrid aria-hidden="true" className="size-5" strokeWidth={1.5} />
              {t("viewAll")}
            </Button>
            {branches.map((category) => (
              <Button
                key={category.id}
                variant={categoryId === category.id ? "secondary" : "ghost"}
                aria-pressed={categoryId === category.id}
                onClick={() => setCategory(category.id)}
                className="min-h-12 gap-2.5 px-3 [&_svg]:size-5"
              >
                <span
                  className={
                    /فضة|الفضة|silver/i.test(
                      `${groups.data?.find((group) => group.id === groupId)?.name_ar} ${groups.data?.find((group) => group.id === groupId)?.name_en}`,
                    )
                      ? "text-silver"
                      : "text-gold"
                  }
                >
                  <CategoryIcon name={`${category.name_ar} ${category.name_en}`} />
                </span>
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
