import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { mediaResponse, publicMediaPath } from "@/lib/media-access";
import { requestedImageWidth } from "@/lib/responsive-images";
import { cachedMediaBytes } from "@/lib/media-delivery";

// Media files live in the Hostinger database (media_files) and are served only when published content references them.
export const Route = createFileRoute("/api/public/media/$")({
  staticData: { sitemap: false },
  server: { handlers: {
    GET: async ({ params, request }) => {
      const path = params._splat ?? "";
      if (!publicMediaPath(path)) return new Response("Not found", { status: 404 });
      const width = requestedImageWidth(new URL(request.url).searchParams.get("w"));
      const { sql } = await import("@/lib/mysql.server");
      return mediaResponse(path, {
        isPublished: async (url) => {
          const ref = await sql(`SELECT 1 FROM products WHERE active = 1 AND image_url = ?
            UNION SELECT 1 FROM slides WHERE active = 1 AND (image_url = ? OR link = ?)
            UNION SELECT 1 FROM posts WHERE published = 1 AND image_url = ?
            UNION SELECT 1 FROM services WHERE image_url = ?
            UNION SELECT 1 FROM sections WHERE image_url = ?
            UNION SELECT 1 FROM site_settings WHERE id = 1 AND (logo_url = ? OR app_link = ? OR login_logo_url = ? OR login_background_url = ? OR (popup_enabled = 1 AND popup_link = ?) OR (serial_bg_enabled = 1 AND serial_bg_image = ?)) LIMIT 1`, Array(12).fill(url));
          if (ref.length) return true;
          // SEO share images are still managed with the SEO tools.
          const supaUrl = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
          if (!supaUrl || !key) return false;
          const client = createClient<Database>(supaUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
          const { data, error } = await client.rpc("is_published_media", { _url: url });
          return !error && data === true;
        },
        // "sign" only confirms the stored file exists; bytes come from deliver.
        sign: async (objectPath) => ((await sql("SELECT 1 FROM media_files WHERE path = ? LIMIT 1", [objectPath])).length ? objectPath : null),
        deliver: async (objectPath) => {
          const [file] = await sql<{ mime: string; data: Buffer }>("SELECT mime, data FROM media_files WHERE path = ?", [objectPath]);
          if (!file) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
          return cachedMediaBytes(new Response(new Uint8Array(file.data), { headers: { "Content-Type": file.mime, "Content-Length": String(file.data.length) } }));
        },
      }, width);
    },
  } },
});
