import { queryOptions } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { latestVerifiedPrice, readSiteRows } from "@/lib/site-data.functions";
import { uploadMedia } from "@/lib/media.functions";
import type { SiteTable } from "@/lib/site-schema";
import { createImageVariants, optimizeUploadedImage } from "@/lib/image-optimization";

type Row = Record<string, any>;
const read = <T = Row>(table: SiteTable, opts: { order?: string; ascending?: boolean; eq?: Record<string, string | number | boolean>; single?: boolean } = {}) =>
  readSiteRows({ data: { table, ...opts } }) as Promise<T[]>;

// Site content is read from the Hostinger MySQL database through server functions.
export const settingsQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["settings"],
  queryFn: async () => {
    const [row] = await read<Tables<"site_settings">>("site_settings", { eq: { id: 1 } });
    if (!row) throw new Error("الإعدادات غير موجودة");
    return row;
  },
});
export const verifiedPricesQuery = queryOptions({ staleTime: 30_000, queryKey: ["verified-prices"], queryFn: () => latestVerifiedPrice() });
export const slidesQuery = queryOptions({ staleTime: 30_000, queryKey: ["slides"], queryFn: () => read<Tables<"slides">>("slides", { order: "sort" }) });
export const pricesQuery = queryOptions({ staleTime: 30_000, queryKey: ["prices"], queryFn: () => read<Tables<"metal_prices">>("metal_prices", { order: "sort" }) });
export const historyQuery = queryOptions({ staleTime: 30_000, queryKey: ["history"], queryFn: () => read<Tables<"price_history">>("price_history", { order: "day" }) });
export const sectionsQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["sections"],
  queryFn: async () => {
    const rows = await read<Tables<"sections">>("sections");
    return Object.fromEntries(rows.map((r) => [r.key, r])) as Record<string, Tables<"sections">>;
  },
});
export const servicesQuery = queryOptions({ staleTime: 30_000, queryKey: ["services"], queryFn: () => read<Tables<"services">>("services", { order: "sort" }) });
export const productsQuery = queryOptions({ staleTime: 30_000, queryKey: ["products"], queryFn: () => read<Tables<"products">>("products", { order: "sort" }) });
export const productGroupsQuery = queryOptions({ staleTime: 30_000, queryKey: ["product-groups"], queryFn: () => read<Tables<"product_groups">>("product_groups", { order: "sort" }) });
export const productCategoriesQuery = queryOptions({ staleTime: 30_000, queryKey: ["product-categories"], queryFn: () => read<Tables<"product_categories">>("product_categories", { order: "sort" }) });
export const productQuery = (id: string) =>
  queryOptions({
    staleTime: 30_000,
    queryKey: ["products", id],
    queryFn: async () => (await read<Tables<"products">>("products", { eq: { id }, single: true }))[0] ?? null,
  });
export const postsQuery = (kind?: "blog" | "news") =>
  queryOptions({
    staleTime: 30_000,
    queryKey: ["posts", kind ?? "all"],
    queryFn: () => read<Tables<"posts">>("posts", { order: "created_at", ascending: false, ...(kind ? { eq: { kind } } : {}) }),
  });
export const postQuery = (slug: string) =>
  queryOptions({
    staleTime: 30_000,
    queryKey: ["post", slug],
    queryFn: async () => (await read<Tables<"posts">>("posts", { eq: { slug }, single: true }))[0] ?? null,
  });

export function whatsappLink(number: string | null | undefined, text: string) {
  const n = (number ?? "").replace(/[^\d]/g, "");
  const message = text.trim();
  return message ? `https://wa.me/${n}?text=${encodeURIComponent(message)}` : `https://wa.me/${n}`;
}

/** Zakat: nisab = 85 g of 24K equivalent, 2.5% of value. */
export function calcZakat(grams: number, karat: number, price24PerGram: number) {
  const pure = grams * (karat / 24);
  const value = pure * price24PerGram;
  const due = pure >= 85 ? value * 0.025 : 0;
  return { pure, value, due, aboveNisab: pure >= 85 };
}

export async function uploadImage(file: File): Promise<string> {
  const optimized = await optimizeUploadedImage(file);
  const filename = optimized.name.replace(/[^\w.-]/g, "_");
  const path = `${Date.now()}-${filename.replace(/^_+/, "") || "goldcenter-image.webp"}`;
  const send = (file: Blob, target: string) => { const form = new FormData(); form.append("file", file, target); form.append("path", target); return uploadMedia({ data: form }); };
  await send(optimized, path);
  // Optional display copies must never block a successful original upload.
  try {
    const variants = await createImageVariants(optimized, path);
    await Promise.all(variants.map(variant => send(variant.file, variant.path)));
  } catch { /* The media handler falls back to the original when variants are unavailable. */ }
  return `/api/public/media/${encodeURIComponent(path)}`;
}
