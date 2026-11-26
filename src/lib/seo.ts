import { z } from "zod";
import { productPrice } from "@/lib/product-pricing";
import { pick, type Lang } from "@/lib/i18n";
import type { Database } from "@/integrations/supabase/types";

type Row<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export const SEO_ORIGIN = "https://goldcenterstr.com";
export const publicPathSchema = z.string().max(300).regex(/^\/(?!\/)[^?#\\]*$/).refine(v => !/^\/(admin|auth|api|account|cart|favorites|reset-password|set-password)(\/|$)/.test(v), "Only public site paths are allowed").refine(v => { try { return !/[\\?#]/.test(decodeURIComponent(v)) && !decodeURIComponent(v).startsWith("//"); } catch { return false; } });
export const seoPageInput = z.object({ path: publicPathSchema, lang: z.enum(["ar", "en"]).default("ar") });
export const keywordCategories = ["gold_bars", "silver_bars", "gold_prices", "buy_gold", "bullion_trading", "refining", "wholesale", "brand"];
export type SiteBundle = {
  settings: Row<"site_settings">; products: Row<"products">[]; posts: Row<"posts">[];
  services: Row<"services">[]; groups: Row<"product_groups">[]; categories: Row<"product_categories">[];
  sections: Row<"sections">[]; slides: Row<"slides">[]; prices: Row<"metal_prices">[]; history: Row<"price_history">[];
  seo: Row<"seo_pages">[]; images: Row<"seo_images">[]; config: Row<"seo_config"> | null;
};
export const staticSeoPages: Record<string, { ar: string; en: string; desc_ar: string; desc_en: string }> = {
  "/": { ar: "أسعار الذهب وسبائك الذهب والفضة", en: "Gold prices, gold and silver bullion", desc_ar: "أسعار الذهب والفضة ومنتجات السبائك وخدمات جولد سنتر للأفراد وتجار الجملة والتكرير.", desc_en: "Gold and silver prices, bullion products and Gold Center services for customers, wholesale traders and refining." },
  "/products": { ar: "منتجاتنا — سبائك الذهب والفضة", en: "Gold and silver bullion products", desc_ar: "تصفح منتجات جولد سنتر من سبائك الذهب والفضة وتحقق من أسعارها وتوفرها.", desc_en: "Browse Gold Center gold and silver bullion products, current prices and availability." },
  "/services": { ar: "خدمات الذهب والجملة والتكرير", en: "Gold, wholesale and refining services", desc_ar: "تعرف على خدمات جولد سنتر في الذهب والفضة والبيع بالجملة وتكرير الذهب.", desc_en: "Explore Gold Center gold, silver, wholesale and gold refining services." },
  "/about": { ar: "من نحن", en: "About us", desc_ar: "تعرف على جولد سنتر وتاريخه ورؤيته وخدماته في الذهب والفضة.", desc_en: "Learn about Gold Center, its history, vision and gold and silver services." },
  "/contact": { ar: "تواصل معنا", en: "Contact us", desc_ar: "تواصل مع جولد سنتر للاستفسار عن المنتجات والذهب والفضة وخدمات الجملة.", desc_en: "Contact Gold Center about products, gold, silver and wholesale services." },
  "/blog": { ar: "المدونة — أدلة الذهب والفضة", en: "Blog — gold and silver guides", desc_ar: "مقالات وأدلة جولد سنتر عن الذهب والفضة والسبائك.", desc_en: "Gold Center articles and guides about gold, silver and bullion." },
  "/news": { ar: "أخبار الذهب والفضة", en: "Gold and silver news", desc_ar: "أخبار وتقارير سوق الذهب والفضة من جولد سنتر.", desc_en: "Gold and silver market news and reports from Gold Center." },
  "/check-bar": { ar: "افحص سبيكتك", en: "Check your bullion bar", desc_ar: "تحقق من مطابقة سيريال سبيكتك مع سجل جولد سنتر والمواصفات المسجلة.", desc_en: "Check an exact bullion serial against Gold Center’s registry and recorded specifications." },
};
export function pagePath(page: Row<"seo_pages">) { return page.url_slug ? page.path.replace(/[^/]+$/, page.url_slug) : page.path; }
export function findSeoPage(bundle: SiteBundle, path: string) { return bundle.seo.find(p => p.path === path || pagePath(p) === path); }
export function pageContent(bundle: SiteBundle, path: string) {
  const page = findSeoPage(bundle, path);
  const id = page?.entity_id;
  const segment = path.split("/").pop();
  const product = bundle.products.find(p => p.id === id || (path.startsWith("/products/") && p.id === segment));
  const post = bundle.posts.find(p => p.id === id || (path.startsWith("/posts/") && p.slug === segment));
  const service = bundle.services.find(p => p.id === id || (path.startsWith("/services/") && p.id === segment));
  const group = bundle.groups.find(p => p.id === id || (path.startsWith("/groups/") && p.id === segment));
  const category = bundle.categories.find(p => p.id === id || (path.startsWith("/categories/") && p.id === segment));
  return { page, product, post, service, group, category };
}
function absoluteImage(value: string | null | undefined) { if (value?.startsWith("/api/public/media/")) return SEO_ORIGIN + value; return value?.startsWith("https://") ? value : undefined; }
export function imageAlt(bundle: SiteBundle, url: string | null | undefined, fallback: string, lang: Lang) {
  const row = bundle.images.find(i => i.url === url);
  return row?.decorative ? "" : pick(row, "alt", lang) || fallback;
}
export function buildSeo(bundle: SiteBundle, path: string, lang: Lang = "ar") {
  const { page, product, post, service, group, category } = pageContent(bundle, path);
  const content = product || post || service || group || category;
  const defaults = staticSeoPages[path];
  const exists = Boolean(defaults || content);
  const brand = pick(bundle.settings, "site_name", lang);
  const name = content ? pick(content, product || group || category ? "name" : "title", lang) : defaults?.[lang] ?? (lang === "ar" ? "الصفحة غير موجودة" : "Page not found");
  const rawDescription = content ? pick(content, product ? "description" : post ? "excerpt" : "body", lang) : defaults?.[lang === "ar" ? "desc_ar" : "desc_en"] ?? "";
  const description = pick(page, "description", lang) || rawDescription.replace(/[#*\[\]]/g, "").replace(/\s+/g, " ").slice(0, 300) || name;
  const title = pick(page, "title", lang) || `${name}${brand ? ` | ${brand}` : ""}`;
  const cleanPath = page ? pagePath(page) : path;
  const canonical = (page?.canonical_url || SEO_ORIGIN + cleanPath) + (lang === "en" ? "?lang=en" : "");
  const image = absoluteImage(page?.image_url || (content && "image_url" in content ? content.image_url : path === "/" ? bundle.slides[0]?.image_url : undefined));
  const robots = exists ? page?.robots ?? "index" : "noindex";
  const schema: Record<string, unknown>[] = [];
  const organization: Record<string, unknown> = { "@context": "https://schema.org", "@type": "Organization", name: brand, url: SEO_ORIGIN };
  if (bundle.settings.phone) organization["telephone"] = bundle.settings.phone.replace(/[^\d+]/g, "").replace(/\+$/, "");
  if (bundle.settings.email) organization["email"] = bundle.settings.email;
  const logo = absoluteImage(bundle.settings.logo_url); if (logo) organization["logo"] = logo;
  if (path === "/") {
    schema.push(organization, { "@context": "https://schema.org", "@type": "WebSite", name: brand, url: SEO_ORIGIN, inLanguage: lang });
    const address = pick(bundle.settings, "address", lang);
    if (address && bundle.settings.phone) schema.push({ ...organization, "@type": "LocalBusiness", address });
  }
  if (product) {
    const data: Record<string, unknown> = { "@context": "https://schema.org", "@type": "Product", name, description, sku: product.id, url: canonical };
    if (image) data["image"] = image;
    const price = productPrice(product, bundle.settings);
    const availability: Record<string, string> = { available: "InStock", unavailable: "OutOfStock", reservation: "PreOrder", coming_soon: "PreOrder" };
    if (price !== null && Number.isFinite(price) && price > 0 && availability[product.availability]) data["offers"] = { "@type": "Offer", price, priceCurrency: "EGP", availability: `https://schema.org/${availability[product.availability]}`, url: canonical };
    schema.push(data);
  } else if (post) {
    schema.push({ "@context": "https://schema.org", "@type": "Article", headline: name, description, mainEntityOfPage: canonical, datePublished: post.publish_at || post.created_at, publisher: organization, ...(image ? { image } : {}) });
  } else if (exists) schema.push({ "@context": "https://schema.org", "@type": "WebPage", name: title, description, url: canonical, inLanguage: lang });
  if (content) schema.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: brand, item: SEO_ORIGIN }, { "@type": "ListItem", position: 2, name, item: canonical }] });
  return { title, description, canonical, robots, image, schema, name, page, exists, lang,
    ogTitle: pick(page, "og_title", lang) || title, ogDescription: pick(page, "og_description", lang) || description,
    twitterTitle: pick(page, "twitter_title", lang) || title, twitterDescription: pick(page, "twitter_description", lang) || description,
    card: page?.twitter_card ?? "summary_large_image" };
}
export type SeoResult = ReturnType<typeof buildSeo>;
export function seoHead(result?: SeoResult) {
  if (!result) return { meta: [{ title: "الصفحة غير متاحة | جولد سنتر" }, { name: "robots", content: "noindex" }], links: [], scripts: [] };
  return {
    meta: [{ title: result.title }, { name: "description", content: result.description }, { name: "robots", content: result.robots === "noindex" ? "noindex,follow" : "index,follow" }, { property: "og:title", content: result.ogTitle }, { property: "og:description", content: result.ogDescription }, { property: "og:type", content: result.schema.some(s => s["@type"] === "Article") ? "article" : result.schema.some(s => s["@type"] === "Product") ? "product" : "website" }, { property: "og:url", content: result.canonical }, { name: "twitter:card", content: result.card }, { name: "twitter:title", content: result.twitterTitle }, { name: "twitter:description", content: result.twitterDescription }, ...(result.image ? [{ property: "og:image", content: result.image }, { name: "twitter:image", content: result.image }] : [])],
    links: [{ rel: "canonical", href: result.canonical }, { rel: "alternate", hrefLang: "ar", href: result.canonical.split("?")[0] }, { rel: "alternate", hrefLang: "en", href: `${result.canonical.split("?")[0]}?lang=en` }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(result.schema).replace(/</g, "\\u003c") }],
  };
}
export function seoRecommendation(text: string, keyword: string) { return !keyword.trim() ? "missing_keyword" : text.toLowerCase().includes(keyword.trim().toLowerCase()) ? "keyword_present" : "keyword_missing"; }