import { loadPublicPage } from "@/lib/seo-public.functions";
import { seoHead } from "@/lib/seo";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useLang, pick } from "@/lib/i18n";
import { servicesQuery, settingsQuery, whatsappLink } from "@/lib/data";
import { PageHero, fallbackImages } from "@/components/site";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/services")({
  staticData: { sitemap: true },
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: ({ context, deps }) => loadPublicPage(context.queryClient, "/services", deps.lang),
  head: ({ loaderData }) => seoHead(loaderData?.seo),
  component: Services,
});

function Services() {
  const { t, lang } = useLang();
  const { data: list = [] } = useQuery(servicesQuery);
  const { data: s } = useQuery(settingsQuery);
  return (
    <main>
      <PageHero title={t("services")} />
      <section className="mx-auto max-w-6xl space-y-10 px-4 py-12">
        {list.map((x, i) => (
          <div key={x.id} className="grid items-center gap-8 md:grid-cols-2">
            <img
              src={x.image_url || fallbackImages[(i + 2) % 4]}
              alt={pick(x, "title", lang)}
              loading="lazy"
              className={`aspect-[4/3] w-full rounded-xl border border-border object-cover object-center md:aspect-[16/10] ${i % 2 ? "md:order-2" : ""}`}
            />
            <div>
              <h2 className="mb-3 text-3xl text-gold-gradient">{pick(x, "title", lang)}</h2>
              <Link to="/services/$id" params={{ id: x.id }} className="mb-4 inline-block text-gold underline">{t("readMore")}</Link>
              <p className="mb-5 whitespace-pre-line leading-relaxed text-muted-foreground">
                {pick(x, "body", lang)}
              </p>
              <Button
                asChild
                className="h-auto bg-gold-gradient px-6 py-2.5 font-semibold text-primary-foreground"
              >
                <a
                  href={whatsappLink(s?.whatsapp_number, pick(x, "title", lang))}
                  onClick={() => {
                    try {
                      window.__lovableEvents?.track?.("project.whatsapp_clicked", {
                        placement: "service",
                      });
                    } catch {
                      /* analytics is optional */
                    }
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("contact")}
                </a>
              </Button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
