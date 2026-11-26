import { loadPublicPage } from "@/lib/seo-public.functions";
import { seoHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  Gem,
  Handshake,
  Info,
  Quote,
  Sparkles,
  Target,
} from "lucide-react";
import { useLang, pick } from "@/lib/i18n";
import {
  productsQuery,
  sectionsQuery,
  servicesQuery,
  settingsQuery,
  whatsappLink,
} from "@/lib/data";
import { PageHero, SectionTitle, fallbackImages } from "@/components/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  staticData: { sitemap: true },
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: ({ context, deps }) => loadPublicPage(context.queryClient, "/about", deps.lang),
  head: ({ loaderData }) => seoHead(loaderData?.seo),
  component: About,
});

const serviceIcons = [Handshake, Gem, Sparkles];

function About() {
  const { t, lang } = useLang();
  const { data: sec } = useQuery(sectionsQuery);
  const { data: s } = useQuery(settingsQuery);
  const { data: services = [] } = useQuery(servicesQuery);
  const { data: products = [] } = useQuery(productsQuery);

  const years = s?.years_experience ?? 90;
  const stats = [
    { icon: Building2, value: `${years}+`, label: t("years") },
    { icon: Gem, value: `${products.length}`, label: t("products") },
    { icon: Handshake, value: `${services.length}`, label: t("services") },
  ];

  const values = pick(sec?.["values"], "body", lang)
    .split(/[،,]/)
    .map((v) => v.trim())
    .filter(Boolean);

  const story = [
    { key: "history", icon: Info },
    { key: "chairman", icon: Quote },
  ] as const;

  const pillars = [
    { key: "vision", icon: Target },
    { key: "mission", icon: Sparkles },
    { key: "values", icon: CheckCircle2 },
  ] as const;

  return (
    <main>
      <PageHero title={t("about")} centered />

      {/* Company information */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <img
            src={sec?.["about"]?.image_url || fallbackImages[0]}
            alt=""
            loading="lazy"
            className="aspect-4/3 w-full rounded-xl border border-border object-cover"
          />
          <div>
            <p className="mb-2 text-sm tracking-widest text-gold">{t("companyInfo")}</p>
            <h2 className="mb-4 text-3xl text-gold-gradient">
              {pick(sec?.["about"], "title", lang) || t("about")}
            </h2>
            <p className="mb-8 leading-relaxed text-muted-foreground">
              {pick(sec?.["about"], "body", lang)}
            </p>
            <dl className="grid grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-4 text-center"
                >
                  <stat.icon className="mx-auto mb-2 h-5 w-5 text-gold" aria-hidden="true" />
                  <dd className="font-display text-2xl font-bold text-gold">{stat.value}</dd>
                  <dt className="mt-1 text-xs leading-tight text-muted-foreground">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Story + chairman message */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          {story.map(({ key, icon: Icon }, i) =>
            sec?.[key] ? (
              <article
                key={key}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                {(sec[key].image_url || i === 0) && (
                  <img
                    src={sec[key].image_url || fallbackImages[i === 0 ? 1 : 2]}
                    alt=""
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-2xl text-gold">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {pick(sec[key], "title", lang)}
                  </h3>
                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                    {pick(sec[key], "body", lang)}
                  </p>
                </div>
              </article>
            ) : null,
          )}
        </div>
      </section>

      {/* Vision / mission / values */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map(({ key, icon: Icon }) =>
            sec?.[key] ? (
              <article key={key} className="rounded-xl border border-border bg-card p-6">
                <span className="mb-4 grid h-11 w-11 place-items-center rounded-full border border-border bg-secondary text-gold">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mb-3 text-xl text-gold">{pick(sec[key], "title", lang)}</h3>
                {key === "values" && values.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {values.map((v) => (
                      <li
                        key={v}
                        className="rounded-full border border-gold/40 px-3 py-1 text-sm text-muted-foreground"
                      >
                        {v}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                    {pick(sec[key], "body", lang)}
                  </p>
                )}
              </article>
            ) : null,
          )}
        </div>
      </section>

      {/* Company services */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionTitle title={t("services")} />
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((x, i) => {
            const Icon = serviceIcons[i % serviceIcons.length] ?? Handshake;
            return (
              <article
                key={x.id}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
                <img
                  src={x.image_url || fallbackImages[(i + 2) % 4]}
                  alt={pick(x, "title", lang)}
                  loading="lazy"
                  className="aspect-video w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 flex items-center gap-2 text-xl text-gold">
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {pick(x, "title", lang)}
                  </h3>
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {pick(x, "body", lang)}
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="h-auto w-full justify-center gap-2 border-gold/50 py-2.5 text-gold hover:bg-gold/10"
                  >
                    <a
                      href={whatsappLink(s?.whatsapp_number, pick(x, "title", lang))}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        try {
                          window.__lovableEvents?.track?.("project.whatsapp_clicked", {
                            placement: "about_service",
                          });
                        } catch {
                          /* analytics is optional */
                        }
                      }}
                    >
                      {t("contact")}
                    </a>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link to="/services" className="text-gold hover:underline">
            {t("viewAll")}
          </Link>
        </div>
      </section>

      {/* Closing call to action */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-gold/40 bg-card p-8 text-center md:flex-row md:text-start">
          <div>
            <h2 className="mb-2 text-2xl text-gold-gradient">{pick(s, "site_name", lang)}</h2>
            <p className="text-muted-foreground">{pick(sec?.["about"], "body", lang)}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-gold-gradient font-semibold text-primary-foreground">
              <Link to="/contact">{t("contact")}</Link>
            </Button>
            <Button asChild variant="outline" className="border-gold/50 text-gold">
              <Link to="/products">{t("products")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
