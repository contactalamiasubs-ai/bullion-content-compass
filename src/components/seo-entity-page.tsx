import { SeoImage } from "@/components/seo-image";
import { Link } from "@tanstack/react-router";
import { useLang, pick } from "@/lib/i18n";
import { pageContent, imageAlt, type SiteBundle } from "@/lib/seo";
import { ProductCard } from "@/components/site";
import { SeoContent } from "@/components/seo-content";
import { Button } from "@/components/ui/button";
import { whatsappLink } from "@/lib/data";
export function SeoEntityPage({ bundle, path }: { bundle: SiteBundle; path: string }) {
  const { lang, t } = useLang(); const { service, group, category } = pageContent(bundle, path);
  const row = service || group || category;
  if (!row) return <main className="mx-auto max-w-5xl px-4 py-20"><h1>{lang === "ar" ? "الصفحة غير موجودة" : "Page not found"}</h1><Button asChild variant="outline"><Link to="/products">{t("products")}</Link></Button></main>;
  const name = pick(row, service ? "title" : "name", lang);
  const categoryIds = group ? bundle.categories.filter(c => c.group_id === group.id).map(c => c.id) : [category?.id];
  const products = bundle.products.filter(p => categoryIds.includes(p.category_id ?? ""));
  return <main className="mx-auto max-w-7xl px-4 py-12">
    <nav className="mb-8 text-sm text-muted-foreground"><Link to="/">{t("home")}</Link> / <Link to={service ? "/services" : "/products"}>{t(service ? "services" : "products")}</Link></nav>
    <h1 className="mb-10 break-words text-center font-display text-3xl text-gold sm:text-4xl">{name}</h1>
    {service ? <div className="grid items-start gap-8 md:grid-cols-2">
      {service.image_url && <SeoImage src={service.image_url} alt={imageAlt(bundle, service.image_url, name, lang)} width={1000} height={700} className="aspect-[10/7] w-full object-cover" />}
      <div className="space-y-8"><SeoContent body={pick(service, "body", lang)} /><Button asChild><a href={whatsappLink(bundle.settings.whatsapp_number, name)} target="_blank" rel="noopener noreferrer">{t("contact")}</a></Button></div>
    </div> : <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{products.map((p,i) => <ProductCard key={p.id} p={p} idx={i} />)}</section>}
  </main>;
}