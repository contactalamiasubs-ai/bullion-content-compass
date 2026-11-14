import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type CatalogProduct = Database["public"]["Tables"]["products"]["Row"];
export const recommendationInput = z.object({
  needs: z.string().trim().min(3).max(1200),
  budget: z.number().finite().positive(),
  lang: z.enum(["ar", "en"]),
});

export function eligibleProducts(products: CatalogProduct[], budget: number) {
  return products.filter(
    (product) =>
      product.active &&
      product.price != null &&
      Number.isFinite(product.price) &&
      product.price > 0 &&
      product.price <= budget,
  );
}

const suggestionSchema = z.object({
  suggestions: z
    .array(z.object({ id: z.string(), reason: z.string().trim().min(1).max(700) }))
    .max(4),
});

export function validateRecommendations(
  output: unknown,
  products: CatalogProduct[],
  budget: number,
) {
  const { suggestions } = suggestionSchema.parse(output);
  const available = new Map(
    eligibleProducts(products, budget).map((product) => [product.id, product]),
  );
  const seen = new Set<string>();
  return suggestions.flatMap((suggestion) => {
    const product = available.get(suggestion.id);
    if (!product || seen.has(product.id)) return [];
    seen.add(product.id);
    return [{ product, reason: suggestion.reason }];
  });
}

export type RecommendationResult = {
  items: ReturnType<typeof validateRecommendations>;
  error: "unavailable" | "credits" | "refusal" | null;
};
