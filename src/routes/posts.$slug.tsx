import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useLang, pick } from "@/lib/i18n";
import { postQuery } from "@/lib/data";
import { fallbackImages } from "@/components/site";

export const Route = createFileRoute("/posts/$slug")({
  head: () => ({
    meta: [
      { title: "مقال | جولد سنتر" },
      { name: "description", content: "اقرأ المقال كاملًا على جولد سنتر." },
      { property: "og:title", content: "مقال | جولد سنتر" },
      { property: "og:description", content: "اقرأ المقال كاملًا." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Post,
});

function Post() {
  const { slug } = Route.useParams();
  const { lang, t } = useLang();
  const { data: p, isLoading } = useQuery(postQuery(slug));
  if (isLoading) return <main className="min-h-[60vh]" />;
  if (!p)
    return (
      <main className="py-32 text-center">
        <Link to="/blog" className="text-gold">
          {t("blog")}
        </Link>
      </main>
    );
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <img
        src={p.image_url || fallbackImages[1]}
        alt={pick(p, "title", lang)}
        className="mb-8 aspect-video w-full rounded-xl object-cover"
      />
      <p className="mb-2 text-sm text-muted-foreground">
        {new Date(p.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
      </p>
      <h1 className="mb-6 text-4xl font-bold text-gold-gradient">{pick(p, "title", lang)}</h1>
      <article className="whitespace-pre-line text-lg leading-loose text-foreground/90">
        {pick(p, "body", lang)}
      </article>
    </main>
  );
}
