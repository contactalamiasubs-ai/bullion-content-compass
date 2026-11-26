import { describe, expect, it, vi } from "vitest";
import { mediaResponse } from "@/lib/media-access";

describe("Published media access", () => {
  it("never signs an unreferenced or unpublished file", async () => {
    const sign = vi.fn();
    const response = await mediaResponse("private.pdf", { isPublished: vi.fn().mockResolvedValue(false), sign });
    expect(response.status).toBe(404);
    expect(sign).not.toHaveBeenCalled();
  });
  it("signs only the exact approved public content path", async () => {
    const isPublished = vi.fn().mockResolvedValue(true);
    const sign = vi.fn().mockResolvedValue("https://media.example/file?short-lived=1");
    const response = await mediaResponse("logo.png", { isPublished, sign });
    expect(isPublished).toHaveBeenCalledWith("/api/public/media/logo.png");
    expect(sign).toHaveBeenCalledWith("logo.png");
    expect(response.status).toBe(302);
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=300");
  });
  it.each(["../private.pdf", ".hidden", "nested/file.pdf", "", "a".repeat(201)])("rejects unsafe path %s before lookup or signing", async (path) => {
    const isPublished = vi.fn(); const sign = vi.fn();
    expect((await mediaResponse(path, { isPublished, sign })).status).toBe(404);
    expect(isPublished).not.toHaveBeenCalled(); expect(sign).not.toHaveBeenCalled();
  });
  it("returns not found when the approved object no longer exists", async () => {
    expect((await mediaResponse("missing.png", { isPublished: vi.fn().mockResolvedValue(true), sign: vi.fn().mockResolvedValue(null) })).status).toBe(404);
  });
  it("checks original publication before signing a responsive variant", async () => {
    const sign = vi.fn().mockResolvedValue("https://media.example/small.webp");
    const isPublished = vi.fn().mockResolvedValue(true);
    const response = await mediaResponse("bar.jpg", { isPublished, sign }, 320);
    expect(isPublished).toHaveBeenCalledWith("/api/public/media/bar.jpg");
    expect(sign).toHaveBeenCalledExactlyOnceWith("bar.jpg.w320.webp");
    expect(response.headers.get("Location")).toBe("https://media.example/small.webp");
  });
  it("retains the original when a variant is absent", async () => {
    const sign = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce("https://media.example/original.jpg");
    const response = await mediaResponse("bar.jpg", { isPublished: vi.fn().mockResolvedValue(true), sign }, 640);
    expect(sign.mock.calls).toEqual([["bar.jpg.w640.webp"], ["bar.jpg"]]);
    expect(response.status).toBe(302);
  });
  it("never signs variants for unpublished images", async () => {
    const sign = vi.fn();
    expect((await mediaResponse("hidden.jpg", {isPublished: vi.fn().mockResolvedValue(false), sign}, 320)).status).toBe(404);
    expect(sign).not.toHaveBeenCalled();
  });
});