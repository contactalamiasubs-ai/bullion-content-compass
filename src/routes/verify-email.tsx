import { createFileRoute } from "@tanstack/react-router";
import { VerifyEmailPanel } from "@/components/login-panel";
export const Route = createFileRoute("/verify-email")({
  staticData: { sitemap: false },
  validateSearch: (s: Record<string, unknown>) => ({ email: typeof s["email"] === "string" ? s["email"].slice(0, 255) : "" }),
  head: () => ({ meta: [{ title: "تحقق من البريد | جولد سنتر" }, { name: "description", content: "تحقق من البريد في جولد سنتر." }, { property: "og:title", content: "تحقق من البريد | جولد سنتر" }, { property: "og:description", content: "تحقق من البريد في جولد سنتر." }, { name: "robots", content: "noindex" }] }),
  component: Page,
});
function Page() { const { email } = Route.useSearch(); return <VerifyEmailPanel email={email} />; }
