import { loadPublicPage } from "@/lib/seo-public.functions";
import { seoHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/lib/i18n";
import { postsQuery } from "@/lib/data";
import { PageHero, PostCard } from "@/components/site";

export const Route = createFileRoute("/blog")({
  staticData: { sitemap: true },
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: ({ context, deps }) => loadPublicPage(context.queryClient, "/blog", deps.lang),
  head: ({ loaderData }) => seoHead(loaderData?.seo),
  component: () => <PostList kind="blog" />,
});

export function PostList({ kind }: { kind: "blog" | "news" }) {
  const { t } = useLang();
  const { data = [] } = useQuery(postsQuery(kind));
  return (
    <main>
      <PageHero title={t(kind)} />
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-12 md:grid-cols-3">
        {data.map((p, i) => (
          <PostCard key={p.slug} p={p} idx={i} />
        ))}
      </section>
    </main>
  );
}
