import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { z } from "zod";
export const Route = createFileRoute("/api/public/seo-refresh")({
  staticData: { sitemap: false },
  server: { handlers: { POST: async ({ request }) => {
    const failure = await authenticateCronRequest(request); if (failure) return failure;
    const body = z.object({kind:z.literal("daily")}).strict().safeParse(await request.json().catch(()=>null));
    if (!body.success) return new Response("Invalid request",{status:400});
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const report = await supabaseAdmin.from("seo_reports").select("selected_property").eq("provider","search_console").maybeSingle();
    if (report.error) return new Response("Cache unavailable",{status:503});
    if (!report.data?.selected_property || !process.env["GOOGLE_SEARCH_CONSOLE_API_KEY"]) return Response.json({status:"paused_until_setup"});
    const state = await supabaseAdmin.from("seo_sync_state").select("blocked,retry_at").eq("id",1).maybeSingle();
    if (state.error) return new Response("Cache unavailable",{status:503});
    if (state.data?.blocked || (state.data?.retry_at && Date.parse(state.data.retry_at)>Date.now())) return Response.json({status:"paused_until_setup_or_retry"});
    try {
      const { refreshSearchSnapshot } = await import("@/lib/seo-google.server");
      const result = await refreshSearchSnapshot(supabaseAdmin,report.data.selected_property);
      if (result.status!=="ok") return Response.json({status:result.status});
      const { syncSeoSitemap } = await import("@/lib/seo-sitemap-sync.server");
      const sitemap = await syncSeoSitemap(supabaseAdmin,report.data.selected_property);
      return Response.json({status:result.status,sitemap});
    } catch(error) {
      const message = error instanceof Error ? error.message : "Refresh failed";
      await supabaseAdmin.from("seo_reports").update({error:message}).eq("provider","search_console");
      const { GoogleRequestError } = await import("@/lib/seo-google.server");
      if (error instanceof GoogleRequestError && [403,429].includes(error.status)) await supabaseAdmin.from("seo_sync_state").upsert({id:1,blocked:error.status===403,retry_at:error.retryAt});
      return Response.json({status:"refresh_failed"},{status:503});
    }
  } } },
});