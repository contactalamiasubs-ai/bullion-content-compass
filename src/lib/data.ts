import { queryOptions } from "@tanstack/react-query";
import type { Tables } from "@/integrations/supabase/types";
import { latestVerifiedPrice, readSiteRows } from "@/lib/site-data.functions";
import { uploadMedia } from "@/lib/media.functions";
import type { SiteTable } from "@/lib/site-schema";

type Row = Record<string, any>;
const read = <T = Row>(table: SiteTable, opts: { order?: string; ascending?: boolean; eq?: Record<string, string | number | boolean>; single?: boolean } = {}) =>
  readSiteRows({ data: { table, ...opts } }) as Promise<T[]>;

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const [row] = await read<Tables<"site_settings">>("site_settings", { eq: { id: 1 } });
    if (!row) throw new Error("الإعدادات غير موجودة");
    return row;
  },
});
export const verifiedPricesQuery = queryOptions({
  queryKey: ["verified-prices"],
  queryFn: () => latestVerifiedPrice(),
});
export const slidesQuery = queryOptions({ queryKey: ["slides"], queryFn: () => read<Tables<"slides">>("slides", { order: "sort" }) });
export const pricesQuery = queryOptions({ queryKey: ["prices"], queryFn: () => read<Tables<"metal_prices">>("metal_prices", { order: "sort" }) });
export const historyQuery = queryOptions({ queryKey: ["history"], queryFn: () => read<Tables<"price_history">>("price_history", { order: "day" }) });
export const sectionsQuery = queryOptions({
  queryKey: ["sections"],
  queryFn: async () => {
    const rows = await read<Tables<"sections">>("sections");
    return Object.fromEntries(rows.map((r) => [r.key, r])) as Record<string, Tables<"sections">>;
  },
});
export const servicesQuery = queryOptions({ queryKey: ["services"], queryFn: () => read<Tables<"services">>("services", { order: "sort" }) });
export const productsQuery = queryOptions({ queryKey: ["products"], queryFn: () => read<Tables<"products">>("products", { order: "sort" }) });
export const productGroupsQuery = queryOptions({ queryKey: ["product-groups"], queryFn: () => read<Tables<"product_groups">>("product_groups", { order: "sort" }) });
export const productCategoriesQuery = queryOptions({ queryKey: ["product-categories"], queryFn: () => read<Tables<"product_categories">>("product_categories", { order: "sort" }) });
export const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["products", id],
    queryFn: async () => (await read<Tables<"products">>("products", { eq: { id }, single: true }))[0] ?? null,
  });
export const postsQuery = (kind?: "blog" | "news") =>
  queryOptions({
    queryKey: ["posts", kind ?? "all"],
    queryFn: () => read<Tables<"posts">>("posts", { order: "created_at", ascending: false, ...(kind ? { eq: { kind } } : {}) }),
  });
export const postQuery = (slug: string) =>
  queryOptions({
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
  const form = new FormData();
  form.append("file", file);
  const { path } = await uploadMedia({ data: form });
  return `/api/public/media/${encodeURIComponent(path)}`;
}
