import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mediaResponse, publicMediaPath, publishedMediaOrigin } from "@/lib/media-access";

// Media files stay in the private bucket; each request gets a fresh short-lived signed link.
export const Route = createFileRoute("/api/public/media/$")({
  server: { handlers: {
    GET: async ({ params }) => {
      const path = params._splat ?? "";
      const publicPath = publicMediaPath(path);
      if (!publicPath) return new Response("Not found", { status: 404 });
      // Files moved to the Hostinger database are served directly when referenced by published content.
      if (process.env["MYSQL_HOST"]) {
        try {
          const { sql } = await import("@/lib/mysql.server");
          const ref = await sql(`SELECT 1 FROM products WHERE active = 1 AND image_url = ?
            UNION SELECT 1 FROM slides WHERE active = 1 AND (image_url = ? OR link = ?)
            UNION SELECT 1 FROM posts WHERE published = 1 AND image_url = ?
            UNION SELECT 1 FROM services WHERE image_url = ?
            UNION SELECT 1 FROM sections WHERE image_url = ?
            UNION SELECT 1 FROM site_settings WHERE id = 1 AND (logo_url = ? OR app_link = ? OR (popup_enabled = 1 AND popup_link = ?) OR (serial_bg_enabled = 1 AND serial_bg_image = ?)) LIMIT 1`, Array(10).fill(publicPath));
          if (!ref.length) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
          const [file] = await sql<{ mime: string; data: Buffer }>("SELECT mime, data FROM media_files WHERE path = ?", [path]);
          if (file) return new Response(new Uint8Array(file.data), { headers: { "Content-Type": file.mime, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
        } catch (error) {
          console.error("media lookup failed", error);
        }
      }
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
