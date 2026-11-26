import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createImageVariants, optimizeUploadedImage } from "@/lib/image-optimization";

async function q<T>(
  p: PromiseLike<{ data: T; error: { message: string } | null }>,
): Promise<NonNullable<T>> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as NonNullable<T>;
}

export const settingsQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["settings"],
  queryFn: () => q(supabase.from("site_settings").select("*").eq("id", 1).single()),
});
export const verifiedPricesQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["verified-prices"],
  queryFn: () =>
    q(
      supabase.rpc("latest_verified_price"),
    ),
});
export const slidesQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["slides"],
  queryFn: () => q(supabase.from("slides").select("*").order("sort")),
});
export const pricesQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["prices"],
  queryFn: () => q(supabase.from("metal_prices").select("*").order("sort")),
});
export const historyQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["history"],
  queryFn: () => q(supabase.from("price_history").select("*").order("day")),
});
export const sectionsQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["sections"],
  queryFn: async () => {
    const rows = await q(supabase.from("sections").select("*"));
    return Object.fromEntries(rows.map((r) => [r.key, r])) as Record<string, (typeof rows)[number]>;
  },
});
export const servicesQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["services"],
  queryFn: () => q(supabase.from("services").select("*").order("sort")),
});
export const productsQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["products"],
  queryFn: () => q(supabase.from("products").select("*").order("sort")),
});
export const productGroupsQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["product-groups"],
  queryFn: () => q(supabase.from("product_groups").select("*").order("sort")),
});
export const productCategoriesQuery = queryOptions({
  staleTime: 30_000,
  queryKey: ["product-categories"],
  queryFn: () => q(supabase.from("product_categories").select("*").order("sort")),
});
export const productQuery = (id: string) =>
  queryOptions({
    staleTime: 30_000,
    queryKey: ["products", id],
    queryFn: () => q(supabase.from("products").select("*").eq("id", id).maybeSingle()),
  });
export const postsQuery = (kind?: "blog" | "news") =>
  queryOptions({
    staleTime: 30_000,
    queryKey: ["posts", kind ?? "all"],
    queryFn: () => {
      let b = supabase.from("posts").select("*").order("created_at", { ascending: false });
      if (kind) b = b.eq("kind", kind);
      return q(b);
    },
  });
export const postQuery = (slug: string) =>
  queryOptions({
    staleTime: 30_000,
    queryKey: ["post", slug],
    queryFn: () => q(supabase.from("posts").select("*").eq("slug", slug).maybeSingle()),
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
  const { error } = await supabase.storage.from("media").upload(path, optimized, { cacheControl: "31536000" });
  if (error) throw error;
  // Optional display copies must never block a successful original upload.
  try {
    const variants = await createImageVariants(optimized, path);
    await Promise.all(variants.map(variant => supabase.storage.from("media").upload(variant.path, variant.file, { contentType: "image/webp", cacheControl: "31536000" })));
  } catch { /* The media handler falls back to the original when variants are unavailable. */ }
  return `/api/public/media/${encodeURIComponent(path)}`;
}
