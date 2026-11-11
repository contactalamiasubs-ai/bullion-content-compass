import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ArrowRight } from "lucide-react";
import { useLang, pick } from "@/lib/i18n";
import { productQuery, productsQuery, settingsQuery, whatsappLink } from "@/lib/data";
import { fallbackImages, ProductCard } from "@/components/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/products_/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل المنتج | جولد سنتر" },
      { name: "description", content: "تفاصيل المنتج وسعره، واطلبه مباشرة عبر واتساب من جولد سنتر." },
      { property: "og:title", content: "تفاصيل المنتج | جولد سنتر" },
      { property: "og:description", content: "تفاصيل المنتج واطلبه عبر واتساب." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { lang, t } = useLang();
  const { data: p, isLoading } = useQuery(productQuery(id));
  const { data: s } = useQuery(settingsQuery);
  const { data: all = [] } = useQuery(productsQuery);
  if (isLoading) return <main className="min-h-[60vh]" />;
  if (!p || !p.active)
    return (
      <main className="py-32 text-center">
        <p className="mb-4 text-muted-foreground">{lang === "ar" ? "المنتج غير موجود" : "Product not found"}</p>
        <Link to="/products" className="text-gold hover:underline">{t("products")}</Link>
      </main>
    );
  const name = pick(p, "name", lang);
  const desc = pick(p, "description", lang);
  const msg = lang === "ar" ? `مرحبًا، أريد طلب: ${name}` : `Hello, I'd like to order: ${name}`;
  const related = all.filter((x) => x.active && x.id !== p.id).slice(0, 4);
  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <Link to="/products" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold">
        <ArrowRight className="h-4 w-4 ltr:rotate-180" /> {t("products")}
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <img src={p.image_url || fallbackImages[0]} alt={name} className="aspect-square w-full rounded-xl border border-border object-cover" />
        <div className="flex flex-col justify-center">
          <h1 className="mb-4 text-4xl font-bold text-gold-gradient">{name}</h1>
          {p.price != null && <p className="mb-6 text-2xl font-semibold text-gold" dir="ltr">{Number(p.price).toLocaleString("en")} EGP</p>}
          {desc && <p className="mb-8 whitespace-pre-line leading-loose text-muted-foreground">{desc}</p>}
          <Button asChild className="inline-flex h-auto w-fit items-center gap-2 bg-gold-gradient px-8 py-3 font-semibold text-primary-foreground">
          <a
            href={whatsappLink(s?.whatsapp_number, msg)}
            onClick={() => { try { window.__lovableEvents?.track?.("project.whatsapp_clicked", { placement: "product", product_id: p.id }); } catch {} }}
            target="_top" rel="noreferrer"
          >
            <MessageCircle className="h-5 w-5" /> {t("buyWhatsapp")}
          </a>
          </Button>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl text-gold-gradient">{lang === "ar" ? "منتجات أخرى" : "More products"}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((r, i) => <ProductCard key={r.id} p={r} idx={i} />)}
          </div>
        </section>
      )}
    </main>
  );
}
