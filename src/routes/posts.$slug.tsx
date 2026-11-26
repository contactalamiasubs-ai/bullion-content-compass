import { SeoImage } from "@/components/seo-image";
import { loadPublicPage } from "@/lib/seo-public.functions";
import { seoHead, pageContent, imageAlt } from "@/lib/seo";
import { SeoContent } from "@/components/seo-content";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useLang, pick } from "@/lib/i18n";
import { postQuery } from "@/lib/data";
import { fallbackImages } from "@/components/site";

export const Route = createFileRoute("/posts/$slug")({
  staticData: { sitemap: true },
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: async ({ params, context, deps }) => { const result = await loadPublicPage(context.queryClient, `/posts/${params.slug}`, deps.lang); if (!result.seo.exists) throw notFound(); return result; },
  head: ({ loaderData }) => seoHead(loaderData?.seo),
  component: Post,
});

function Post() {
  const { slug } = Route.useParams();
  const { lang, t } = useLang();
  const loaded = Route.useLoaderData();
  const initial = pageContent(loaded.bundle, `/posts/${slug}`).post;
  const { data: p, isLoading } = useQuery({ ...postQuery(initial?.slug ?? slug), ...(initial ? { initialData: initial } : {}) });
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
      <SeoImage
        src={p.image_url || fallbackImages[1]}
        alt={imageAlt(loaded.bundle, p.image_url, pick(p, "image_alt", lang) || pick(p, "title", lang), lang)}
        width={1200}
        height={675}
        className="mb-8 aspect-video w-full rounded-xl object-cover"
      />
      <p className="mb-2 text-sm text-muted-foreground">
        {new Date(p.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
      </p>
      <h1 className="mb-6 text-4xl font-bold text-gold-gradient">{pick(p, "title", lang)}</h1>
      <SeoContent body={pick(p, "body", lang)} />
    </main>
  );
}
