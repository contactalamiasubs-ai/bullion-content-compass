import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { calcZakat, whatsappLink } from "@/lib/data";

describe("zakat", () => {
  it("no zakat below 85g of 24K equivalent", () => {
    expect(calcZakat(90, 21, 1000).due).toBe(0); // 78.75g pure
  });
  it("2.5% of value at or above nisab", () => {
    expect(calcZakat(100, 24, 1000).due).toBe(2500);
  });
});

describe("whatsapp", () => {
  it("strips non-digits from the number", () => {
    expect(whatsappLink("+20 100-000", "hi")).toBe("https://wa.me/20100000?text=hi");
  });
});
