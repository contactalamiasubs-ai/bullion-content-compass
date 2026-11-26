import { SeoImage } from "@/components/seo-image";
import { loadPublicPage } from "@/lib/seo-public.functions";
import { seoHead, pageContent, imageAlt } from "@/lib/seo";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ArrowRight } from "lucide-react";
import { useLang, pick } from "@/lib/i18n";
import {
  productQuery,
  productsQuery,
  settingsQuery,
  whatsappLink,
  productGroupsQuery,
  productCategoriesQuery,
} from "@/lib/data";
import { fallbackImages, ProductCard } from "@/components/site";
import { Button } from "@/components/ui/button";
import { productPrice } from "@/lib/product-pricing";
import { FavoriteButton, AddToCartButton } from "@/components/product-shopping-actions";
import { ProductAvailability } from "@/components/product-availability";
import { canOrderProduct, productAvailability } from "@/lib/product-availability";
import { useShopping, useShoppingText } from "@/components/shopping-provider";

export const Route = createFileRoute("/products_/$id")({
  staticData: { sitemap: true },
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: async ({ params, context, deps }) => { const result = await loadPublicPage(context.queryClient, `/products/${params.id}`, deps.lang); if (!result.seo.exists) throw notFound(); return result; },
  head: ({ loaderData }) => seoHead(loaderData?.seo),
  component: ProductPage,
});

function ProductPage() {
  const loaded = Route.useLoaderData();
  const product = pageContent(loaded.bundle, loaded.seo.page?.path ?? loaded.seo.canonical.replace("https://goldcenterstr.com", "").split("?")[0] ?? "").product;
  const id = product?.id ?? Route.useParams().id;
  const { view, ready } = useShopping();
  useEffect(() => { if (ready) view(id); }, [id, view, ready]);
  const { lang, t } = useLang();
  const shoppingText = useShoppingText();
  // The loader snapshot must also seed the first browser render, matching SSR.
  const { data: p, isLoading } = useQuery({ ...productQuery(id), ...(product ? { initialData: product } : {}) });
  const { data: s } = useQuery(settingsQuery);
  const { data: all = [] } = useQuery(productsQuery);
  const { data: groups = [] } = useQuery(productGroupsQuery);
  const { data: categories = [] } = useQuery(productCategoriesQuery);
  if (isLoading) return <main className="min-h-[60vh]" />;
  if (!p || !p.active)
    return (
      <main className="py-32 text-center">
        <p className="mb-4 text-muted-foreground">
          {lang === "ar" ? "المنتج غير موجود" : "Product not found"}
        </p>
        <Link to="/products" className="text-gold hover:underline">
          {t("products")}
        </Link>
      </main>
    );
  const name = pick(p, "name", lang);
  const price = productPrice(p, s);
  const category = categories.find((item) => item.id === p.category_id);
  const group = groups.find((item) => item.id === category?.group_id);
  const desc = pick(p, "description", lang);
  const available = canOrderProduct(p);
  const reservation = productAvailability(p.availability) === "reservation";
  const msg = lang === "ar"
    ? `مرحبًا، أريد ${available ? "طلب" : reservation ? "حجز" : "الاستفسار عن"}: ${name}`
    : `Hello, I'd like to ${available ? "order" : reservation ? "reserve" : "inquire about"}: ${name}`;
  const related = all.filter((x) => x.active && x.id !== p.id).slice(0, 4);
  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <Link
        to="/products"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold"
      >
        <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {t("products")}
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <SeoImage
          src={p.image_url || fallbackImages[0]}
          alt={imageAlt(loaded.bundle, p.image_url, name, lang)}
          width={900}
          height={900}
          className="aspect-square w-full rounded-xl border border-border object-cover"
        />
        <div className="flex flex-col justify-center">
          <div><ProductAvailability value={p.availability} /></div>
          {category && (
            <p className="mb-3 text-sm text-muted-foreground">
              {pick(group, "name", lang)} / {pick(category, "name", lang)}
            </p>
          )}
          <div className="mb-4 flex items-start justify-between gap-4">
            <h1 className="min-w-0 break-words text-4xl font-bold text-gold-gradient">{name}</h1>
            <FavoriteButton id={p.id} />
          </div>
          {price != null && (
            <p className="mb-6 text-2xl font-semibold text-gold" dir="ltr">
              {price.toLocaleString("en", { maximumFractionDigits: 2 })} EGP
            </p>
          )}
          {desc && (
            <p className="mb-8 whitespace-pre-line leading-loose text-muted-foreground">{desc}</p>
          )}
          <dl className="mb-8 grid grid-cols-2 gap-x-6 text-sm">
            {[
              [shoppingText("metal"), shoppingText(p.pricing_metal === "silver" ? "silver" : "gold")],
              [shoppingText("weight"), p.weight_grams],
              [shoppingText("karat"), p.pricing_metal === "silver" ? null : p.karat],
              [shoppingText("making_charge"), p.gram_pricing ? p.making_charge : null],
            ].filter(([, value]) => value != null).map(([label, value]) => <div key={String(label)} className="border-b border-border py-3">
              <dt className="mb-1 text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd>
            </div>)}
          </dl>
          {available && <div className="mb-3 max-w-sm"><AddToCartButton id={p.id} /></div>}
          <Button
            asChild
            className="inline-flex h-auto w-fit items-center gap-2 bg-gold-gradient px-8 py-3 font-semibold text-primary-foreground"
          >
            <a
              href={whatsappLink(s?.whatsapp_number, msg)}
              onClick={() => {
                try {
                  window.__lovableEvents?.track?.("project.whatsapp_clicked", {
                    placement: "product",
                    product_id: p.id,
                  });
                } catch {
                  /* analytics is optional */
                }
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-5 w-5" /> {available ? t("buyWhatsapp") : shoppingText(reservation ? "reserve_product" : "inquire_product")}
            </a>
          </Button>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl text-gold-gradient">
            {lang === "ar" ? "منتجات أخرى" : "More products"}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((r, i) => (
              <ProductCard key={r.id} p={r} idx={i} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
