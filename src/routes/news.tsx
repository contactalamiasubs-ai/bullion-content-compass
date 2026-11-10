import { createFileRoute } from "@tanstack/react-router";
import { PostList } from "./blog";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "أخبار الذهب | دار السبائك" },
      { name: "description", content: "آخر أخبار أسواق الذهب والفضة والتقرير اليومي." },
      { property: "og:title", content: "أخبار الذهب | دار السبائك" },
      { property: "og:description", content: "آخر أخبار أسواق الذهب والفضة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <PostList kind="news" />,
});
