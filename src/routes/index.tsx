import { SeoImage } from "@/components/seo-image";
import { responsiveImage } from "@/lib/responsive-images";
import { catalogSearch } from "@/lib/catalog-pagination";
import { loadPublicPage } from "@/lib/seo-public.functions";
import { seoHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, BookOpen, Download, ShieldCheck, Smartphone } from "lucide-react";
import { useLang, pick } from "@/lib/i18n";
import { ProductCatalog } from "@/components/product-catalog";
import { CatalogDownload } from "@/components/catalog-download";
import { settingsQuery, sectionsQuery, servicesQuery, postsQuery } from "@/lib/data";
import {
  HeroSlider,
  PriceTicker,
  PriceTable,
  PriceChart,
  ZakatCalculator,
  PostCard,
  SectionTitle,
  fallbackImages,
} from "@/components/site";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  validateSearch: catalogSearch,
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: ({ context, deps }) => loadPublicPage(context.queryClient, "/", deps.lang),
  head: ({ loaderData }) => {
    const head = seoHead(loaderData?.seo);
    const image = loaderData?.bundle.slides.find(slide => slide.active)?.image_url;
    const responsive = responsiveImage(image ?? undefined);
    return { ...head, links: [...head.links, ...(image ? [{ rel: "preload", as: "image", href: responsive.src || image, imageSrcSet: responsive.srcSet, imageSizes: "(max-width: 767px) 180vw, 100vw", fetchPriority: "high" as const }] : [])] };
  },
  component: Index,
});

function Index() {
  const { t, lang } = useLang();
  const { data: s } = useQuery(settingsQuery);
  const { data: sec } = useQuery(sectionsQuery);
  const { data: services = [] } = useQuery(servicesQuery);
  const { data: posts = [] } = useQuery(postsQuery());
  const hub = [
    { i: FileText, l: t("dailyReport"), to: "/news" as const },
    { i: BookOpen, l: t("goldGuide"), to: "/blog" as const },
    { i: Download, l: t("catalog"), catalog: true },
    {
      i: ShieldCheck,
      l: pick(sec?.["serial_check_card"], "title", lang) || t("verify"),
      to: "/check-bar" as const,
    },
  ];
  return (
    <main>
      <HeroSlider />
      <PriceTicker />

      <section id="prices" className="mx-auto grid max-w-7xl scroll-mt-48 gap-6 px-4 py-16 lg:grid-cols-2">
        <PriceTable />
        <div className="space-y-6">
          <PriceChart />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <SectionTitle title={t("products")} />
        <ProductCatalog limit={6} />
        <div className="mt-8 text-center">
          <Link to="/products" className="text-gold hover:underline">
            {t("viewAll")}
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <SectionTitle title={t("services")} />
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((x, i) => (
            <div key={x.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <SeoImage
                src={x.image_url || fallbackImages[(i + 2) % 4]}
                alt={pick(x, "title", lang)}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover object-center sm:aspect-video"
              />
              <div className="p-5">
                <h3 className="mb-2 text-xl text-gold">{pick(x, "title", lang)}</h3>
                <p className="text-sm text-muted-foreground">{pick(x, "body", lang)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <SeoImage
          src={sec?.["about"]?.image_url || fallbackImages[0]}
          alt={pick(sec?.["about"], "title", lang) || t("about")}
          width={800}
          height={600}
          loading="lazy"
          className="aspect-[4/3] w-full rounded-xl border border-border object-cover object-center md:aspect-auto md:h-auto"
        />
        <div>
          <p className="font-display text-7xl font-bold text-gold-gradient">
            {s?.years_experience ?? 90}+
          </p>
          <p className="mb-4 text-xl text-muted-foreground">{t("years")}</p>
          <h2 className="mb-4 text-3xl">{pick(sec?.["about"], "title", lang)}</h2>
          <p className="mb-6 leading-relaxed text-muted-foreground">
            {pick(sec?.["about"], "body", lang)}
          </p>
          <Link to="/about" className="text-gold hover:underline">
            {t("readMore")}
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 lg:grid-cols-2">
        <div>
          <h2 className="mb-6 text-3xl text-gold-gradient">{t("infoHub")}</h2>
          <div className="grid grid-cols-2 gap-4">
            {hub.map((h) => (
              "catalog" in h ? <CatalogDownload key={h.l} className="h-auto flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center hover:border-gold [&_svg]:h-8 [&_svg]:w-8 [&_svg]:text-gold" /> : <Link
                key={h.l}
                to={h.to}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center hover:border-gold"
              >
                <h.i className="h-8 w-8 text-gold" />
                <span>{h.l}</span>
              </Link>
            ))}
          </div>
        </div>
        <ZakatCalculator />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <SectionTitle title={t("latest")} />
        <div className="grid gap-6 md:grid-cols-3">
          {posts.slice(0, 3).map((p, i) => (
            <PostCard key={p.slug} p={p} idx={i} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-gold/40 bg-card p-10 md:flex-row">
          <div className="flex items-center gap-4">
            <Smartphone className="h-12 w-12 text-gold" />
            <div>
              <h3 className="text-2xl text-gold-gradient">{pick(sec?.["app"], "title", lang)}</h3>
              <p className="text-muted-foreground">{pick(sec?.["app"], "body", lang)}</p>
            </div>
          </div>
          <a
            href={s?.app_link ?? "#"}
            className="rounded-md bg-gold-gradient px-7 py-3 font-semibold text-primary-foreground"
          >
            {t("download")}
          </a>
        </div>
      </section>
    </main>
  );
}
