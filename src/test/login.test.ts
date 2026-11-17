import { describe, expect, it } from "vitest";
import { authErrorKey, sessionNeedsSignOut } from "@/lib/login";
describe("existing account login", () => {
  it("requires a new login after a non-remembered tab session ends", () => {
    expect(sessionNeedsSignOut("tab", null)).toBe(true);
    expect(sessionNeedsSignOut("tab", "active")).toBe(false);
  });
  it("retains remembered sessions", () => {
    expect(sessionNeedsSignOut("persistent", null)).toBe(false);
  });
  it("maps actual rejected credentials and unconfirmed accounts", () => {
    expect(authErrorKey({ code: "invalid_credentials" })).toBe("auth_invalid");
    expect(authErrorKey({ code: "email_not_confirmed" })).toBe("auth_unconfirmed");
    expect(authErrorKey({ status: 429 })).toBe("auth_rate");
  });
});