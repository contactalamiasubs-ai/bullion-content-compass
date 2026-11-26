import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
export const Route = createFileRoute("/api/public/seo-refresh")({
  staticData: { sitemap: false },
  server: { handlers: { POST: async ({ request }) => {
    const failure = await authenticateCronRequest(request); if (failure) return failure;
    const body: unknown = await request.json().catch(()=>null);
    if (!body || typeof body !== "object" || !("kind" in body) || body.kind !== "daily") return new Response("Invalid request",{status:400});
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const report = await supabaseAdmin.from("seo_reports").select("selected_property").eq("provider","search_console").maybeSingle();
    if (report.error) return new Response("Cache unavailable",{status:503});
    if (!report.data?.selected_property || !process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"]) return Response.json({status:"paused_until_setup"});
    try {
      const { refreshSearchSnapshot } = await import("@/lib/seo-google.server");
      const result = await refreshSearchSnapshot(supabaseAdmin,report.data.selected_property);
      return Response.json({status:result.status});
    } catch(error) {
      const message = error instanceof Error ? error.message : "Refresh failed";
      await supabaseAdmin.from("seo_reports").update({error:message}).eq("provider","search_console");
      return Response.json({status:"refresh_failed"},{status:503});
    }
  } } },
});