import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mediaResponse, publicMediaPath, publishedMediaOrigin } from "@/lib/media-access";

// Media files stay in the private bucket; each request gets a fresh short-lived signed link.
export const Route = createFileRoute("/api/public/media/$")({
  staticData: { sitemap: false },
  server: { handlers: {
    GET: async ({ params }) => {
      const path = params._splat ?? "";
      const publicPath = publicMediaPath(path);
      if (!publicPath) return new Response("Not found", { status: 404 });
      if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
        // External hosting has no private key: let the published app sign the link.
        return new Response(null, { status: 302, headers: { Location: `${publishedMediaOrigin}${publicPath}`, "Cache-Control": "no-store" } });
      }
      const url = process.env["SUPABASE_URL"];
      const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
      if (!url || !key) return new Response("Unavailable", { status: 503 });
      const publicClient = createClient<Database>(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        } },
      });
      return mediaResponse(path, {
        isPublished: async (_url) => {
          const { data, error } = await publicClient.rpc("is_published_media", { _url });
          return !error && data === true;
        },
        sign: async (objectPath) => {
          // Only a file referenced by anonymously readable content reaches privileged signing.
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin.storage.from("media").createSignedUrl(objectPath, 60 * 60);
          return !error && data ? data.signedUrl : null;
        },
      });
    },
  } },
});
