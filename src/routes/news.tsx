import { loadPublicPage } from "@/lib/seo-public.functions";
import { seoHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { PostList } from "./blog";

export const Route = createFileRoute("/news")({
  staticData: { sitemap: true },
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: ({ context, deps }) => loadPublicPage(context.queryClient, "/news", deps.lang),
  head: ({ loaderData }) => seoHead(loaderData?.seo),
  component: () => <PostList kind="news" />,
});
