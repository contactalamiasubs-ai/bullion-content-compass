import { describe, expect, it } from "vitest";
import { productPrice } from "@/lib/product-pricing";

describe("product gram pricing", () => {
  const rates = { gold_gram_21: 4500, gold_gram_24: 5200 };
  it("calculates 21K using its gram rate and weight", () => {
    expect(productPrice({ price: 99, gram_pricing: true, weight_grams: 8, karat: 21 }, rates)).toBe(
      36000,
    );
  });
  it("calculates 24K using its gram rate and decimal weight", () => {
    expect(
      productPrice({ price: null, gram_pricing: true, weight_grams: 31.1, karat: 24 }, rates),
    ).toBe(161720);
  });
  it("reflects a changed dashboard gram rate for every linked product", () => {
    const product = { price: null, gram_pricing: true, weight_grams: 10, karat: 24 };
    expect(productPrice(product, rates)).toBe(52000);
    expect(productPrice(product, { ...rates, gold_gram_24: 5300 })).toBe(53000);
  });
  it("preserves manual prices for unlinked products", () => {
    expect(
      productPrice({ price: 40, gram_pricing: false, weight_grams: 8, karat: 21 }, rates),
    ).toBe(40);
  });
  it("does not show a stale manual price when linked rate or weight is missing", () => {
    expect(
      productPrice(
        { price: 40, gram_pricing: true, weight_grams: 8, karat: 21 },
        { ...rates, gold_gram_21: null },
      ),
    ).toBeNull();
    expect(
      productPrice({ price: 40, gram_pricing: true, weight_grams: null, karat: 24 }, rates),
    ).toBeNull();
  });
});
