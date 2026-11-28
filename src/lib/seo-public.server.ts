import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SiteBundle } from "@/lib/seo";
import { readAllPages } from "@/lib/seo-pagination";

export function publicSiteClient() {
  const url = process.env["SUPABASE_URL"], key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Site connection unavailable");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => { const headers = new Headers(init?.headers); if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization"); headers.set("apikey", key); return fetch(input, { ...init, headers }); } } });
}
export async function readPublicBundle(): Promise<SiteBundle> {
  const client = publicSiteClient();
  const siteTables = new Set(["site_settings","products","posts","services","product_groups","product_categories","sections","slides","metal_prices","price_history"]);
  async function rows<T extends keyof Database["public"]["Tables"]>(table: T, order: string) {
    // Site content comes from the Hostinger database; SEO tables stay on Cloud.
    if (siteTables.has(table)) {
      const { sql, normalize } = await import("./mysql.server");
      const found = await sql(`SELECT * FROM \`${table}\` ORDER BY \`${order}\``);
      return found.map((r) => normalize(table as never, r)) as unknown as Database["public"]["Tables"][T]["Row"][];
    }
    return readAllPages<Database["public"]["Tables"][T]["Row"]>(async (offset,limit) => {
      const result = await client.from(table).select("*").order(order).range(offset, offset + limit - 1);
      return {data: result.data as unknown as Database["public"]["Tables"][T]["Row"][] | null,error:result.error};
    });
  }
  const [settings, products, posts, services, groups, categories, sections, slides, prices, history, seo, images, config] = await Promise.all([rows("site_settings", "id"), rows("products", "id"), rows("posts", "id"), rows("services", "id"), rows("product_groups", "id"), rows("product_categories", "id"), rows("sections", "key"), rows("slides", "id"), rows("metal_prices", "id"), rows("price_history", "id"), rows("seo_pages", "path"), rows("seo_images", "id"), client.rpc("public_seo_tags")]);
  if (config.error) throw new Error("Site verification settings unavailable");
  const tags = config.data?.[0];
  const first = settings[0]; if (!first) throw new Error("Site settings unavailable");
  return { settings: first, products: products.filter(p => p.active), posts: posts.filter(p => p.published && (!p.publish_at || Date.parse(p.publish_at) <= Date.now())), services, groups, categories, sections, slides: slides.filter(p => p.active), prices, history, seo, images, config: tags ? { id: 1, google_verification: tags.google_verification, bing_verification: tags.bing_verification, measurement_id: tags.measurement_id } : null };
}