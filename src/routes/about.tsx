import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useLang, pick } from "@/lib/i18n";
import { sectionsQuery, settingsQuery } from "@/lib/data";
import { PageHero, fallbackImages } from "@/components/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن | دار السبائك" },
      { name: "description", content: "تعرف على تاريخنا ورؤيتنا ورسالتنا وقيمنا في سوق الذهب." },
      { property: "og:title", content: "من نحن | دار السبائك" },
      { property: "og:description", content: "تاريخنا ورؤيتنا ورسالتنا وقيمنا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  const { t, lang } = useLang();
  const { data: sec } = useQuery(sectionsQuery);
  const { data: s } = useQuery(settingsQuery);
  const blocks = ["history", "chairman", "vision", "mission", "values"] as const;
  return (
    <main>
      <PageHero title={t("about")} />
      <section className="mx-auto max-w-5xl px-4 py-12">
        <p className="font-display text-6xl font-bold text-gold-gradient">{s?.years_experience ?? 90}+ <span className="text-2xl text-muted-foreground">{t("years")}</span></p>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{pick(sec?.["about"], "body", lang)}</p>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-2">
        {blocks.map((k, i) => sec?.[k] && (
          <div key={k} className="overflow-hidden rounded-xl border border-border bg-card">
            {(sec[k].image_url || i < 2) && <img src={sec[k].image_url || fallbackImages[i]} alt="" loading="lazy" className="aspect-video w-full object-cover" />}
            <div className="p-6">
              <h2 className="mb-3 text-2xl text-gold">{pick(sec[k], "title", lang)}</h2>
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{pick(sec[k], "body", lang)}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
