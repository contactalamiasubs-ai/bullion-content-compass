import { describe, expect, it } from "vitest";
import { canOrderProduct, productAvailability } from "@/lib/product-availability";
import { cartLines } from "@/lib/shopping";

describe("product availability", () => {
  it("allows available products in orders", () => {
    expect(canOrderProduct({ availability: "available" })).toBe(true);
  });
  for (const state of ["unavailable", "reservation", "coming_soon"]) {
    it(`keeps ${state} visible as its state but excludes it from orders`, () => {
      expect(productAvailability(state)).toBe(state);
      expect(canOrderProduct({ availability: state })).toBe(false);
      expect(cartLines([{ id: "bar", active: true, name_ar: "سبيكة", name_en: "Bar", price: 100, availability: state }], { bar: 2 })).toEqual([]);
    });
  }
});