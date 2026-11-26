import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/google-login")({
  staticData: { sitemap: false },
  server: { handlers: {
    GET: async ({ request }) => (await import("@/lib/google-login.server")).handleGoogleLoginGet(request),
    POST: async ({ request }) => (await import("@/lib/google-login.server")).handleGoogleLoginPost(request),
  } },
});
