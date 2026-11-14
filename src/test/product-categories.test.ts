import { describe, expect, it } from "vitest";
import { matchesProductCategory, type ProductCategory } from "@/lib/product-categories";

const categories: ProductCategory[] = [
  { id: "gold-bars", group_id: "gold", name_ar: "سبائك", name_en: "Bars", sort: 0 },
  { id: "gold-coins", group_id: "gold", name_ar: "عملات", name_en: "Coins", sort: 1 },
  { id: "gold-gifts", group_id: "gold", name_ar: "هدايا", name_en: "Gifts", sort: 2 },
  { id: "silver-bars", group_id: "silver", name_ar: "سبائك", name_en: "Bars", sort: 0 },
  { id: "silver-coins", group_id: "silver", name_ar: "عملات", name_en: "Coins", sort: 1 },
  { id: "silver-gifts", group_id: "silver", name_ar: "هدايا", name_en: "Gifts", sort: 2 },
];

describe("product taxonomy", () => {
  it("gold contains bars, coins and gifts but not silver", () => {
    for (const category_id of ["gold-bars", "gold-coins", "gold-gifts"])
      expect(matchesProductCategory({ category_id }, categories, "gold", "")).toBe(true);
    expect(matchesProductCategory({ category_id: "silver-bars" }, categories, "gold", "")).toBe(
      false,
    );
  });
  it("silver has the same three branches separately", () => {
    for (const category_id of ["silver-bars", "silver-coins", "silver-gifts"])
      expect(matchesProductCategory({ category_id }, categories, "silver", "")).toBe(true);
    expect(matchesProductCategory({ category_id: "gold-gifts" }, categories, "silver", "")).toBe(
      false,
    );
  });
  it("subcategory selection narrows to the selected branch", () => {
    expect(
      matchesProductCategory({ category_id: "gold-coins" }, categories, "gold", "gold-coins"),
    ).toBe(true);
    expect(
      matchesProductCategory({ category_id: "gold-bars" }, categories, "gold", "gold-coins"),
    ).toBe(false);
  });
  it("dashboard-added groups work without a hardcoded metal list", () => {
    const custom = [
      ...categories,
      { id: "new", group_id: "custom", name_ar: "جديد", name_en: "New", sort: 0 },
    ];
    expect(matchesProductCategory({ category_id: "new" }, custom, "custom", "")).toBe(true);
    expect(matchesProductCategory({ category_id: "gold-bars" }, custom, "custom", "")).toBe(false);
  });
  it("unclassified existing products remain in the full catalog", () => {
    expect(matchesProductCategory({ category_id: null }, categories, "", "")).toBe(true);
    expect(matchesProductCategory({ category_id: null }, categories, "silver", "")).toBe(false);
  });
});
