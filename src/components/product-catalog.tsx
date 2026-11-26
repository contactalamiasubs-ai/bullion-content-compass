import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Coins, Gift, Gem, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang, pick } from "@/lib/i18n";
import { productsQuery, productGroupsQuery, productCategoriesQuery } from "@/lib/data";
import { matchesProductCategory } from "@/lib/product-categories";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site";
import { catalogPage } from "@/lib/catalog-pagination";

function CategoryIcon({ name, main = false }: { name: string; main?: boolean }) {
  const normalized = name.trim().toLowerCase();
  const size = main ? "size-10" : "size-7";
  if (/فضة|الفضة|silver/.test(normalized)) {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        aria-hidden="true"
        className={size}
      >
        <path d="m5 17 4-5h13l5 5v9H5z" fill="currentColor" fillOpacity="0.18" />
        <path d="M5 17h22M9 12l4 5m9-5-3 5M13 17v9m6-9v9" />
        <path d="m9 9 3-5h10l3 5v3H9z" fill="currentColor" fillOpacity="0.3" />
        <path d="M9 9h16m-13-5 3 5m7-5-3 5" />
        <path d="M15 20h2m-2 3h2" strokeWidth="1.8" />
        <path d="M28 3v5m-2.5-2.5h5" />
      </svg>
    );
  }
  if (/سبائك|bars|bullion|ذهب|gold/.test(normalized)) {
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
  return <Gem aria-hidden="true" className={size} strokeWidth={1.5} />;
}

export function ProductCatalog({ limit }: { limit?: number }) {
  const { t, lang } = useLang();
  const products = useQuery(productsQuery);
  const groups = useQuery(productGroupsQuery);
  const categories = useQuery(productCategoriesQuery);
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const selectedGroup = search.group ?? "";
  const selectedCategory = search.category ?? "";
  const destination = limit ? "/" : "/products";
  const setGroup = (group: string) => void navigate({ to: destination, search: previous => ({ ...previous, group, category: "", page: 1 }), resetScroll: false });
  const setCategory = (category: string) => void navigate({ to: destination, search: previous => ({ ...previous, category, page: 1 }), resetScroll: false });
  const setPage = (page: number) => void navigate({ to: destination, search: previous => ({ ...previous, page }), resetScroll: false });
  const groupId = groups.data?.some((group) => group.id === selectedGroup) ? selectedGroup : "";
  const categoryId = categories.data?.some(
    (category) => category.id === selectedCategory && category.group_id === groupId,
  )
    ? selectedCategory
    : "";
  const branches = (categories.data ?? []).filter((category) => category.group_id === groupId);
  const selectedMain = groups.data?.find((group) => group.id === groupId);
  const branchTone = /فضة|الفضة|silver/i.test(`${selectedMain?.name_ar} ${selectedMain?.name_en}`)
    ? "silver"
    : "gold";
  const visible = (products.data ?? []).filter(
    (product) =>
      product.active && matchesProductCategory(product, categories.data ?? [], groupId, categoryId),
  );
  const loading = products.isLoading || groups.isLoading || categories.isLoading;
  const error = products.error || groups.error || categories.error;
  const pagination = catalogPage(visible, search.page ?? 1);
  const pageItems = limit ? visible.slice(0, limit) : pagination.items;
  return (
    <div>
        <nav
          aria-label={lang === "ar" ? "أقسام المنتجات" : "Product groups"}
          className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-4 border-b border-border pb-8 sm:gap-x-12"
        >
          <Button
            variant="ghost"
            className={`category-choice group ${!groupId ? "text-gold" : "text-muted-foreground hover:text-gold"}`}
            aria-pressed={!groupId}
            onClick={() => {
              setGroup("");
            }}
          >
            <span className="category-medallion">
              <LayoutGrid aria-hidden="true" className="size-9" strokeWidth={1.25} />
            </span>
            <span className="category-label">{t("viewAll")}</span>
          </Button>
          {groups.data?.map((group) => (
            <Button
              key={group.id}
              variant="ghost"
              className="category-choice group"
              data-tone={/فضة|الفضة|silver/i.test(`${group.name_ar} ${group.name_en}`) ? "silver" : "gold"}
              aria-pressed={groupId === group.id}
              onClick={() => {
                setGroup(group.id);
              }}
            >
              <span className="category-medallion">
                <CategoryIcon name={`${group.name_ar} ${group.name_en}`} main />
              </span>
              <span className="category-label">{pick(group, "name", lang)}</span>
            </Button>
          ))}
        </nav>
        <div className="mb-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">{groups.data?.map(group => <Link key={group.id} to="/groups/$id" params={{ id: group.id }} className="hover:text-gold">{pick(group,"name",lang)}</Link>)}</div>
        {groupId && (
          <nav
            aria-label={lang === "ar" ? "الأقسام الفرعية" : "Subcategories"}
            className="mb-10 flex flex-wrap justify-center gap-x-3 gap-y-4 sm:gap-x-8"
            data-tone={branchTone}
          >
            <Button
              variant="ghost"
              aria-pressed={!categoryId}
              onClick={() => setCategory("")}
              className="category-choice category-choice-sub group"
            >
              <span className="category-medallion">
                <LayoutGrid aria-hidden="true" className="size-7" strokeWidth={1.25} />
              </span>
              <span className="category-label">{t("viewAll")}</span>
            </Button>
            {branches.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                aria-pressed={categoryId === category.id}
                onClick={() => setCategory(category.id)}
                className="category-choice category-choice-sub group"
              >
                <span className="category-medallion">
                  <CategoryIcon name={`${category.name_ar} ${category.name_en}`} />
                </span>
                <span className="category-label">{pick(category, "name", lang)}</span>
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
            {pageItems.map((p, i) => (
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
        {!limit && pagination.totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-3" aria-label={t("products")}>
            <Button variant="outline" size="icon" disabled={pagination.page === 1} onClick={() => setPage(pagination.page - 1)} aria-label={lang === "ar" ? "الصفحة السابقة" : "Previous page"}>
              <ChevronRight className="ltr:rotate-180" />
            </Button>
            <span className="min-w-16 text-center tabular-nums" aria-live="polite">{pagination.page} / {pagination.totalPages}</span>
            <Button variant="outline" size="icon" disabled={pagination.page === pagination.totalPages} onClick={() => setPage(pagination.page + 1)} aria-label={lang === "ar" ? "الصفحة التالية" : "Next page"}>
              <ChevronLeft className="ltr:rotate-180" />
            </Button>
          </nav>
        )}
        {groupId && <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">{branches.map(category => <Link key={category.id} to="/categories/$id" params={{ id: category.id }} className="hover:text-gold">{pick(category,"name",lang)}</Link>)}</div>}
    </div>
  );
}
