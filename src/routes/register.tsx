import { createFileRoute } from "@tanstack/react-router";
import { RegisterPanel } from "@/components/login-panel";
export const Route = createFileRoute("/register")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "إنشاء حساب | جولد سنتر" }, { name: "description", content: "إنشاء حساب في جولد سنتر." }, { property: "og:title", content: "إنشاء حساب | جولد سنتر" }, { property: "og:description", content: "إنشاء حساب في جولد سنتر." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});
function Page() { return <RegisterPanel />; }
