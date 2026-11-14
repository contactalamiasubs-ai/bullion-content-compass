import { describe, it, expect } from "vitest";
import { readShopping, setCartQuantity, toggleFavorite, cartLines, cartTotal, cartMessage } from "@/lib/shopping";

const products = [
  { id: "gold", active: true, name_ar: "سبيكة ذهب", name_en: "Gold bar", price: null, gram_pricing: true, weight_grams: 10, karat: 24, making_charge: 250 },
  { id: "silver", active: true, name_ar: "سبيكة فضة", name_en: "Silver bar", price: null, gram_pricing: true, pricing_metal: "silver", weight_grams: 100, making_charge: 100 },
  { id: "hidden", active: false, name_ar: "مخفي", name_en: "Hidden", price: 99 },
];
const rates = { gold_gram_21: 4500, gold_gram_24: 5200, silver_gram: 70 };

describe("visitor shopping", () => {
  it("toggles individual product favorites without duplicates", () => {
    expect(toggleFavorite([], "gold")).toEqual(["gold"]);
    expect(toggleFavorite(["gold", "silver"], "gold")).toEqual(["silver"]);
  });
  it("changes quantities and removes zero-quantity products", () => {
    expect(setCartQuantity({ gold: 1 }, "gold", 3)).toEqual({ gold: 3 });
    expect(setCartQuantity({ gold: 3 }, "gold", 0)).toEqual({});
    expect(setCartQuantity({ gold: 3 }, "gold", -1)).toEqual({ gold: 3 });
    expect(setCartQuantity({ gold: 3 }, "gold", 1.5)).toEqual({ gold: 3 });
  });
  it("restores favorites and valid positive integer quantities", () => {
    expect(readShopping(JSON.stringify({ favorites: ["gold", "gold", 4], cart: { gold: 2, silver: -1, bad: 1.5 } })))
      .toEqual({ favorites: ["gold"], cart: { gold: 2 } });
    expect(readShopping("broken")).toEqual({ favorites: [], cart: {} });
  });
  it("uses live gram prices plus making charges for each quantity", () => {
    const lines = cartLines(products, { gold: 2, silver: 3 }, rates);
    expect(lines[0]?.total).toBe(104500);
    expect(lines[1]?.total).toBe(21300);
    expect(cartTotal(lines)).toBe(125800);
    expect(cartTotal(cartLines(products, { gold: 2 }, { ...rates, gold_gram_24: 5300 }))).toBe(106500);
  });
  it("excludes removed and inactive products from orders", () => {
    expect(cartLines(products, { hidden: 1, removed: 2, gold: 1 }, rates).map((line) => line.product.id)).toEqual(["gold"]);
  });
  it("does not present incomplete linked prices as a full total", () => {
    expect(cartTotal(cartLines(products, { gold: 1 }, { ...rates, gold_gram_24: null }))).toBeNull();
  });
  it("hands off actual product links, quantities and live totals to WhatsApp", () => {
    const lines = cartLines(products, { gold: 2 }, rates);
    const order = cartMessage(lines, "en", "order", "https://goldcenterstr.com", "Gift");
    expect(order).toContain("https://goldcenterstr.com/products/gold");
    expect(order).toContain("Quantity: 2");
    expect(order).toContain("104,500 EGP");
    expect(order).toContain("Gift");
    expect(cartMessage(lines, "en", "inquiry", "https://goldcenterstr.com", "")).not.toBe(order);
  });
});