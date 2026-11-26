import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => mocks }));
import { readPublicBundle } from "@/lib/seo-public.server";

describe("Public SEO access boundary", () => {
  beforeEach(() => {
    vi.stubEnv("SUPABASE_URL", "https://example.test");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    mocks.from.mockReset();
    mocks.rpc.mockReset();
    mocks.from.mockImplementation((table: string) => ({
      select: () => ({ order: () => ({ range: async () => ({
        data: table === "site_settings" ? [{ id: 1 }] : [], error: null,
      }) }) }),
    }));
  });
  afterEach(() => vi.unstubAllEnvs());

  it("reads only the public verification projection, never configuration records", async () => {
    mocks.rpc.mockResolvedValue({ data: [{ google_verification: "google-tag", bing_verification: "bing-tag", measurement_id: "G-123", private_setting: "must-not-leak" }], error: null });
    const bundle = await readPublicBundle();
    expect(mocks.rpc).toHaveBeenCalledWith("public_seo_tags");
    expect(mocks.from.mock.calls.some(([table]) => table === "seo_config")).toBe(false);
    expect(bundle.config).toEqual({ id: 1, google_verification: "google-tag", bing_verification: "bing-tag", measurement_id: "G-123" });
  });

  it("reads image records through the public, published-only access boundary", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    const bundle = await readPublicBundle();
    expect(mocks.from).toHaveBeenCalledWith("seo_images");
    expect(bundle.images).toEqual([]);
    expect(bundle.config).toBeNull();
  });

  it("fails safely if the public tag read fails", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "internal database detail" } });
    await expect(readPublicBundle()).rejects.toThrow("Site verification settings unavailable");
  });
});