import { describe, expect, it, vi } from "vitest";
const oauth = vi.hoisted(() => vi.fn());
vi.mock("@/lib/customer-client", () => ({ customerAuth: { auth: { signInWithOAuth: oauth } } }));
import { customerGoogleOptions, startCustomerGoogle } from "@/lib/customer-google";

describe("customer Google sign-in", () => {
  it("asks Google to let the customer choose their account", () => {
    expect(customerGoogleOptions("https://goldcenterstr.com").options.queryParams.prompt).toBe("select_account");
  });
  it("returns to the public customer callback on the current host", () => {
    expect(customerGoogleOptions("https://goldcenterstr.com").options.redirectTo).toBe("https://goldcenterstr.com/customer-callback");
    expect(customerGoogleOptions("http://localhost:8080").options.redirectTo).toBe("http://localhost:8080/customer-callback");
  });
  it("starts Google through the separate customer project, not staff authentication", async () => {
    oauth.mockResolvedValueOnce({ data: { url: "https://accounts.google.com" }, error: null });
    await startCustomerGoogle("https://goldcenterstr.com");
    expect(oauth).toHaveBeenCalledWith({ provider: "google", options: { redirectTo: "https://goldcenterstr.com/customer-callback", queryParams: { prompt: "select_account" } } });
  });
});