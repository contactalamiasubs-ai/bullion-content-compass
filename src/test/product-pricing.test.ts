import { describe, expect, it } from "vitest";
import { productPrice } from "@/lib/product-pricing";

describe("product gram pricing", () => {
  const rates = { gold_gram_21: 4500, gold_gram_24: 5200 };
  it("prices silver without any karat and adds the fixed making charge once", () => {
    expect(productPrice({ price: 99, gram_pricing: true, pricing_metal: "silver", weight_grams: 100, karat: null, making_charge: 250 }, { ...rates, silver_gram: 70 })).toBe(7250);
  });
  it("propagates the silver gram rate independently of gold rates", () => {
    const silver = { price: null, gram_pricing: true, pricing_metal: "silver", weight_grams: 10, making_charge: 50 };
    expect(productPrice(silver, { ...rates, silver_gram: 70 })).toBe(750);
    expect(productPrice(silver, { ...rates, silver_gram: 80 })).toBe(850);
  });
  it("does not substitute gold or manual prices for a missing silver rate", () => {
    expect(productPrice({ price: 99, gram_pricing: true, pricing_metal: "silver", weight_grams: 10, karat: 24 }, rates)).toBeNull();
  });
  it("adds the fixed coin making charge once to the gold value", () => {
    expect(
      productPrice(
        { price: null, gram_pricing: true, weight_grams: 8, karat: 21, making_charge: 250 },
        rates,
      ),
    ).toBe(36250);
  });
  it("adds a decimal bar making charge and follows changed gram rates", () => {
    const bar = {
      price: null,
      gram_pricing: true,
      weight_grams: 10,
      karat: 24,
      making_charge: 125.75,
    };
    expect(productPrice(bar, rates)).toBe(52125.75);
    expect(productPrice(bar, { ...rates, gold_gram_24: 5300 })).toBe(53125.75);
  });
  it("preserves a manual final price without adding making charge twice", () => {
    expect(productPrice({ price: 1000, gram_pricing: false, making_charge: 250 }, rates)).toBe(
      1000,
    );
  });
  it("rejects invalid making charges", () => {
    for (const making_charge of [-1, Infinity, NaN]) {
      expect(
        productPrice(
          { price: null, gram_pricing: true, weight_grams: 8, karat: 21, making_charge },
          rates,
        ),
      ).toBeNull();
    }
  });
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
