import { createFileRoute } from "@tanstack/react-router";
import { ShoppingPage } from "@/components/shopping-pages";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [
    { title: "سلة المنتجات | جولد سنتر" },
    { name: "description", content: "راجع منتجات الذهب والفضة والكميات وأرسل طلبك أو استفسارك عبر واتساب." },
    { property: "og:title", content: "سلة المنتجات | جولد سنتر" },
    { property: "og:description", content: "راجع منتجاتك وأرسل طلبك إلى جولد سنتر عبر واتساب." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <ShoppingPage mode="cart" />,
});