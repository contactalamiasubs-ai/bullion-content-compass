import { describe, it, expect } from "vitest";
import {
  eligibleProducts,
  recommendationInput,
  validateRecommendations,
  type CatalogProduct,
} from "@/lib/recommendations";

const product = (id: string, price: number | null, active = true): CatalogProduct => ({
  id,
  price,
  active,
  name_ar: id,
  name_en: id,
  description_ar: null,
  description_en: null,
  image_url: null,
  category_id: null,
  created_at: "2026-11-14",
  sort: 0,
});
describe("visitor catalog recommendations", () => {
  it("keeps prices within the visitor's maximum budget, including an exact match", () => {
    expect(
      eligibleProducts(
        [product("silver", 1500), product("gold", 5000), product("expensive", 5001)],
        5000,
      ).map((item) => item.id),
    ).toEqual(["silver", "gold"]);
  });
  it("never suggests hidden or unpriced products as budget matches", () => {
    expect(
      eligibleProducts(
        [
          product("hidden", 100, false),
          product("unknown", null),
          product("zero", 0),
          product("visible", 100),
        ],
        500,
      ).map((item) => item.id),
    ).toEqual(["visible"]);
  });
  it("rejects invented catalog IDs and duplicate suggestions", () => {
    expect(
      validateRecommendations(
        {
          suggestions: [
            { id: "invented", reason: "a" },
            { id: "real", reason: "b" },
            { id: "real", reason: "c" },
          ],
        },
        [product("real", 100)],
        500,
      ).map((item) => item.product.id),
    ).toEqual(["real"]);
  });
  it("uses current catalog prices instead of model-provided prices", () => {
    const output = { suggestions: [{ id: "real", reason: "Suitable", price: 1 }] };
    expect(validateRecommendations(output, [product("real", 350)], 500)[0]?.product.price).toBe(
      350,
    );
    expect(validateRecommendations(output, [product("real", 600)], 500)).toEqual([]);
  });
  it("requires a positive budget and nonempty needs", () => {
    expect(
      recommendationInput.safeParse({ needs: "هدية فضة", budget: 0, lang: "ar" }).success,
    ).toBe(false);
    expect(recommendationInput.safeParse({ needs: "   ", budget: 100, lang: "ar" }).success).toBe(
      false,
    );
  });
});
