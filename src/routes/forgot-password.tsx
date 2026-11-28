import { createFileRoute } from "@tanstack/react-router";
import { ForgotPanel } from "@/components/login-panel";
export const Route = createFileRoute("/forgot-password")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "استعادة كلمة المرور | جولد سنتر" }, { name: "description", content: "استعادة كلمة المرور في جولد سنتر." }, { property: "og:title", content: "استعادة كلمة المرور | جولد سنتر" }, { property: "og:description", content: "استعادة كلمة المرور في جولد سنتر." }, { name: "robots", content: "noindex" }] }),
  component: Page,
});
function Page() { return <ForgotPanel />; }
