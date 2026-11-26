import { describe, expect, it } from "vitest";
import { isAllowedLoginOrigin, loginRedirectUri } from "@/lib/google-login";
import { handleGoogleLoginGet } from "@/lib/google-login.server";

describe("site Google sign-in", () => {
  it("allows only the site's own domains as return addresses", () => {
    expect(loginRedirectUri("https://goldcenterstr.com")).toBe("https://goldcenterstr.com/api/public/google-login");
    expect(isAllowedLoginOrigin("https://www.goldcenterstr.com")).toBe(true);
    expect(isAllowedLoginOrigin("https://evil.example")).toBe(false);
    expect(() => loginRedirectUri("https://goldcenterstr.com.evil.example")).toThrow();
  });
  it("rejects a Google return without the matching state cookie", async () => {
    const res = await handleGoogleLoginGet(new Request("https://goldcenterstr.com/api/public/google-login?code=abc&state=x", { headers: { cookie: "gc_google_state=y" } }));
    expect(res.status).toBe(302);
    const loc = res.headers.get("Location") ?? "";
    expect(loc.startsWith("https://goldcenterstr.com/auth/callback?error_description=")).toBe(true);
    expect(loc).not.toContain("token_hash");
  });
});
