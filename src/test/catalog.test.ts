import { describe, expect, it } from "vitest";
import { validateCatalogPdf } from "@/lib/catalog";

const file = (name: string, content: string) => ({ name, slice: (start: number, end: number) => ({ arrayBuffer: async () => new TextEncoder().encode(content.slice(start, end)).buffer }) }) as File;

describe("catalog PDF upload", () => {
  it("accepts a PDF catalog", async () => {
    await expect(validateCatalogPdf(file("catalog.PDF", "%PDF-1.7"))).resolves.toBeUndefined();
  });
  it("rejects another file disguised as PDF", async () => {
    await expect(validateCatalogPdf(file("catalog.pdf", "<html"))).rejects.toThrow();
  });
  it("rejects non-PDF filenames", async () => {
    await expect(validateCatalogPdf(file("catalog.html", "%PDF-1.7"))).rejects.toThrow();
  });
});