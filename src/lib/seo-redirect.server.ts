import { publicSiteClient } from "@/lib/seo-public.server";
import { publicPathSchema, SEO_ORIGIN } from "@/lib/seo";
export async function seoRedirect(path: string, query: string) {
  if (!publicPathSchema.safeParse(path).success || path === "/") return null;
  const client = publicSiteClient();
  const result = await client.from("seo_redirects").select("target_path").eq("source_path",path).eq("active",true).maybeSingle();
  if (result.error) { console.error("Redirect lookup failed", result.error.message); return null; }
  const target = result.data?.target_path;
  if (!target || target === path || !publicPathSchema.safeParse(target).success) return null;
  return SEO_ORIGIN + target + query;
}