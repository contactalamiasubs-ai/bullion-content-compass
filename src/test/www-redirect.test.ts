import { describe, expect, it } from "vitest";
import { wwwRedirectTarget } from "@/lib/www-redirect";

describe("www redirect", () => {
  it("sends www visitors to the main domain keeping the page and query", () => {
    expect(wwwRedirectTarget("https://www.goldcenterstr.com/products?x=1")).toBe(
      "https://goldcenterstr.com/products?x=1",
    );
  });
  it("uses the forwarded host from the hosting proxy", () => {
    expect(wwwRedirectTarget("http://localhost:3000/about", "www.goldcenterstr.com")).toBe(
      "https://goldcenterstr.com/about",
    );
  });
  it("leaves the main domain alone", () => {
    expect(wwwRedirectTarget("https://goldcenterstr.com/")).toBeNull();
  });
});
