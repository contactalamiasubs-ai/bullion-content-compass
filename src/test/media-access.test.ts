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
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it.each(["../private.pdf", ".hidden", "nested/file.pdf", "", "a".repeat(201)])("rejects unsafe path %s before lookup or signing", async (path) => {
    const isPublished = vi.fn(); const sign = vi.fn();
    expect((await mediaResponse(path, { isPublished, sign })).status).toBe(404);
    expect(isPublished).not.toHaveBeenCalled(); expect(sign).not.toHaveBeenCalled();
  });
  it("returns not found when the approved object no longer exists", async () => {
    expect((await mediaResponse("missing.png", { isPublished: vi.fn().mockResolvedValue(true), sign: vi.fn().mockResolvedValue(null) })).status).toBe(404);
  });
});