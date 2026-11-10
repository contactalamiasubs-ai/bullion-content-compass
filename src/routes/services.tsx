import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useLang, pick } from "@/lib/i18n";
import { servicesQuery, settingsQuery, whatsappLink } from "@/lib/data";
import { PageHero, fallbackImages } from "@/components/site";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "خدماتنا | دار السبائك" },
      { name: "description", content: "خدمات الشركات والجملة والتكرير للذهب والفضة." },
      { property: "og:title", content: "خدماتنا | دار السبائك" },
      { property: "og:description", content: "خدمات الشركات والجملة والتكرير." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
            <img src={x.image_url || fallbackImages[(i + 2) % 4]} alt={pick(x, "title", lang)} loading="lazy" className={`rounded-xl border border-border ${i % 2 ? "md:order-2" : ""}`} />
            <div>
              <h2 className="mb-3 text-3xl text-gold-gradient">{pick(x, "title", lang)}</h2>
              <p className="mb-5 whitespace-pre-line leading-relaxed text-muted-foreground">{pick(x, "body", lang)}</p>
              <a href={whatsappLink(s?.whatsapp_number, pick(x, "title", lang))} target="_blank" rel="noreferrer" className="inline-block rounded-md bg-gold-gradient px-6 py-2.5 font-semibold text-primary-foreground">{t("contact")}</a>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
