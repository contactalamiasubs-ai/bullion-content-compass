import { describe, expect, it } from "vitest";
import { phoneHref } from "@/components/site";

describe("footer phone links", () => {
  it("keeps the international prefix and drops separators", () => {
    expect(phoneHref("+20 100 123 4567")).toBe("+201001234567");
    expect(phoneHref("+20 (100) 123-4567")).toBe("+201001234567");
  });

  it("handles numbers typed without a plus", () => {
    expect(phoneHref("0100 123 4567")).toBe("01001234567");
  });

  it("ignores surrounding spaces", () => {
    expect(phoneHref("  +201001234567  ")).toBe("+201001234567");
  });
});
