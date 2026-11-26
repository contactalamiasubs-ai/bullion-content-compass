import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SeoImage } from "@/components/seo-image";

vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: undefined }) }));
vi.mock("@/lib/seo-public.functions", () => ({ seoBundleQuery: {} }));
vi.mock("@/lib/i18n", () => ({ useLang: () => ({ lang: "ar" }) }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => vi.restoreAllMocks());

describe("Image loading recovery", () => {
  it("retries the original once after a responsive image fails", async () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(false);
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => root.render(<SeoImage src="/api/public/media/background.jpg" />));
    const image = container.querySelector("img");
    if (!image) throw new Error("Image did not mount");
    expect(image.srcset).toContain("?w=640");
    await act(async () => image.dispatchEvent(new Event("error")));
    expect(image.getAttribute("src")).toBe("/api/public/media/background.jpg");
    expect(image.srcset).toBe("");
    await act(async () => image.dispatchEvent(new Event("error")));
    expect(image.getAttribute("src")).toBe("/api/public/media/background.jpg");
    await act(async () => root.render(<SeoImage src="/api/public/media/replacement.jpg" />));
    expect(image.srcset).toContain("replacement.jpg?w=640");
    await act(async () => root.unmount());
  });

  it("recovers an image that failed before hydration attached an error handler", async () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(0);
    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => root.render(<SeoImage src="/api/public/media/login.png" />));
    const image = container.querySelector("img");
    if (!image) throw new Error("Image did not mount");
    expect(image.getAttribute("src")).toBe("/api/public/media/login.png");
    expect(image.srcset).toBe("");
    await act(async () => root.unmount());
  });
});