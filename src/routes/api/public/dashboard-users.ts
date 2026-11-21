import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/dashboard-users")({
  server: { handlers: {
    POST: async ({ request }) => {
      const { createAdminBridgeHandler } = await import("@/lib/admin-users.server");
      return createAdminBridgeHandler()(request);
    },
  } },
});