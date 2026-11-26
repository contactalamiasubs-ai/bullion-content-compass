import { createFileRoute } from "@tanstack/react-router";
import { ShoppingPage } from "@/components/shopping-pages";

export const Route = createFileRoute("/favorites")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { name: "robots", content: "noindex" },
    { title: "المنتجات المفضلة | جولد سنتر" },
    { name: "description", content: "منتجات الذهب والفضة التي أضفتها إلى مفضلتك في جولد سنتر." },
    { property: "og:title", content: "المنتجات المفضلة | جولد سنتر" },
    { property: "og:description", content: "اختياراتك المفضلة من منتجات جولد سنتر." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <ShoppingPage mode="favorites" />,
});