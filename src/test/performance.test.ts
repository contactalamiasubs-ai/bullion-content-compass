import { describe, expect, it } from "vitest";
import { responsiveImage, requestedImageWidth, imageVariantPath } from "@/lib/responsive-images";
import { catalogPage } from "@/lib/catalog-pagination";

describe("Responsive delivery", () => {
  it("selects only bounded known widths", () => {
    expect(requestedImageWidth("640")).toBe(640);
    expect(requestedImageWidth("99999")).toBeNull();
    expect(requestedImageWidth(null)).toBeNull();
    expect(imageVariantPath("gold.jpg", 320)).toBe("gold.jpg.w320.webp");
  });
  it("provides card variants without requesting full-size images", () => {
    const result = responsiveImage("/api/public/media/gold.jpg", 640);
    expect(result.src).toBe("/api/public/media/gold.jpg?w=640");
    expect(result.srcSet).toContain("?w=320 320w");
    expect(result.srcSet).not.toContain("1920");
  });
  it("leaves PDF files and external URLs unchanged", () => {
    expect(responsiveImage("/api/public/media/catalog.pdf")).toEqual({});
    expect(responsiveImage("https://example.com/photo.jpg")).toEqual({});
  });
});
describe("Progressive catalog", () => {
  it("limits each page and preserves every product exactly once", () => {
    const rows = Array.from({length:13}, (_,i) => i);
    const first = catalogPage(rows, 1), last = catalogPage(rows, 2);
    expect(first.items).toHaveLength(8);
    expect(last.items).toHaveLength(5);
    expect([...first.items, ...last.items]).toEqual(rows);
    expect(last.totalPages).toBe(2);
  });
  it("clamps a stale page after filtering", () => {
    expect(catalogPage([1,2], 99).page).toBe(1);
    expect(catalogPage([], -1).items).toEqual([]);
  });
});