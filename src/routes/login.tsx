import { createFileRoute } from "@tanstack/react-router";
import { LoginPanel } from "@/components/login-panel";
export const Route = createFileRoute("/login")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "تسجيل الدخول | جولد سنتر" }, { name: "description", content: "تسجيل الدخول في جولد سنتر." }, { property: "og:title", content: "تسجيل الدخول | جولد سنتر" }, { property: "og:description", content: "تسجيل الدخول في جولد سنتر." }, { name: "robots", content: "noindex" }] }),
  component: Page,
});
function Page() { return <LoginPanel />; }
