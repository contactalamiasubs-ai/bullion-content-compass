import { createFileRoute } from "@tanstack/react-router";
import { LoginPanel } from "@/components/login-panel";
export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "دخول لوحة التحكم | جولد سنتر" },
    { name: "description", content: "تسجيل الدخول الآمن إلى لوحة إدارة جولد سنتر." },
    { property: "og:title", content: "دخول لوحة التحكم | جولد سنتر" },
    { property: "og:description", content: "دخول المسؤول والفريق إلى لوحة إدارة جولد سنتر." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <LoginPanel destination="/admin" />,
});
