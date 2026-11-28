import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mediaResponse, publicMediaPath, publishedMediaOrigin } from "@/lib/media-access";
import { requestedImageWidth } from "@/lib/responsive-images";
import { cachedMediaBytes } from "@/lib/media-delivery";

// Media files stay in the private bucket; each request gets a fresh short-lived signed link.
export const Route = createFileRoute("/api/public/media/$")({
  staticData: { sitemap: false },
  server: { handlers: {
    GET: async ({ params, request }) => {
      const path = params._splat ?? "";
      const publicPath = publicMediaPath(path);
      if (!publicPath) return new Response("Not found", { status: 404 });
      const width = requestedImageWidth(new URL(request.url).searchParams.get("w"));
      const deliver = async (url: string) => {
        const range = request.headers.get("Range");
        const response = await fetch(url, range ? { headers: { Range: range } } : {});
        return cachedMediaBytes(response);
      };
      if (!process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
        // External hosting delegates authorization to the pinned app and streams its media.
        const response = await fetch(`${publishedMediaOrigin}${publicPath}${width ? `?w=${width}` : ""}`, { redirect: "follow", ...(request.headers.get("Range") ? { headers: { Range: request.headers.get("Range") ?? "" } } : {}) });
        if (!response.ok) return new Response("Not found", { status: response.status, headers: { "Cache-Control": "no-store" } });
        return cachedMediaBytes(response);
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
        deliver,
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
      }, width);
    },
  } },
});
