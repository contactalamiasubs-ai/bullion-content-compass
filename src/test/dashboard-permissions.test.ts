import { describe, expect, it } from "vitest";
import { assertCanChangeAccess, canAccessTab, inviteSchema, updateAccessSchema } from "@/lib/dashboard-permissions";

describe("Dashboard permissions", () => {
  it("full admins can manage accounts", () => {
    expect(canAccessTab({ admin: true, permissions: [] }, "users")).toBe(true);
  });
  it("product members cannot manage accounts or prices", () => {
    const access = { admin: false, permissions: ["products"] };
    expect(canAccessTab(access, "products")).toBe(true);
    expect(canAccessTab(access, "product-categories")).toBe(true);
    expect(canAccessTab(access, "users")).toBe(false);
    expect(canAccessTab(access, "gram-rates")).toBe(false);
  });
  it("price members cannot edit general settings", () => {
    const access = { admin: false, permissions: ["prices"] };
    expect(canAccessTab(access, "gram-rates")).toBe(true);
    expect(canAccessTab(access, "source")).toBe(true);
    expect(canAccessTab(access, "settings")).toBe(false);
  });
  it("accounts without permissions cannot open the dashboard overview", () => {
    expect(canAccessTab({ admin: false, permissions: [] }, "overview")).toBe(false);
  });
  it("admins cannot revoke their own administrator access", () => {
    expect(() => assertCanChangeAccess("actor", "actor", false)).toThrow();
    expect(() => assertCanChangeAccess("actor", "other", false)).not.toThrow();
  });
  it("unknown permission values are rejected", () => {
    expect(updateAccessSchema.safeParse({ userId: "3d2278eb-d79e-4a4d-a92c-e43ae288dfe5", admin: false, permissions: ["users"] }).success).toBe(false);
  });
  it("invitations require a valid email", () => {
    expect(inviteSchema.safeParse({ email: "invalid", admin: false, permissions: [] }).success).toBe(false);
  });
});