import { createFileRoute } from "@tanstack/react-router";

const PUBLISHED_ORIGIN = "https://bullion-content-compass.lovable.app";
const SAFE_PATH = /^[\w.-]{1,200}$/;

// Media files stay in the private bucket; each request gets a fresh short-lived signed link.
export const Route = createFileRoute("/api/public/media/$")({
  server: { handlers: {
    GET: async ({ params }) => {
      const path = params._splat ?? "";
      if (!SAFE_PATH.test(path) || path.startsWith(".")) return new Response("Not found", { status: 404 });
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // External hosting has no private key: let the published app sign the link.
        return Response.redirect(`${PUBLISHED_ORIGIN}/api/public/media/${encodeURIComponent(path)}`, 302);
      }
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data, error } = await supabaseAdmin.storage.from("media").createSignedUrl(path, 60 * 60);
      if (error || !data) return new Response("Not found", { status: 404 });
      return new Response(null, { status: 302, headers: { Location: data.signedUrl, "Cache-Control": "public, max-age=1800" } });
    },
  } },
});
