import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/customer-data")({
  staticData: { sitemap: false },
  server: { handlers: {
    POST: async ({ request }) => {
      const { handleCustomerBridge } = await import("@/lib/customers.server");
      return handleCustomerBridge(request);
    },
  } },
});
