import { describe, expect, it } from "vitest";
import { assertCanChangeAccess, assertCanDeleteAccount, canAccessTab, deleteAccountSchema, inviteSchema, updateAccessSchema } from "@/lib/dashboard-permissions";

describe("Dashboard permissions", () => {
  it("catalog management uses content permission", () => {
    expect(canAccessTab({ admin: false, permissions: ["content"] }, "catalog")).toBe(true);
    expect(canAccessTab({ admin: false, permissions: ["products"] }, "catalog")).toBe(false);
  });
  it("customer permission grants customer management but not staff management or serials", () => {
    const access = { admin: false, permissions: ["customers"] };
    expect(canAccessTab(access, "customers")).toBe(true);
    expect(canAccessTab(access, "users")).toBe(false);
    expect(canAccessTab(access, "serials")).toBe(false);
  });
  it("serial permission grants the registry independently of products and customers", () => {
    const access = { admin: false, permissions: ["serials"] };
    expect(canAccessTab(access, "serials")).toBe(true);
    expect(canAccessTab(access, "products")).toBe(false);
    expect(canAccessTab(access, "customers")).toBe(false);
    expect(canAccessTab({ admin: false, permissions: ["products"] }, "serials")).toBe(false);
  });
  it("accepts both new feature permissions when saving or inviting a member", () => {
    const access = { admin: false, permissions: ["customers", "serials"] };
    expect(updateAccessSchema.safeParse({ ...access, userId: "3d2278eb-d79e-4a4d-a92c-e43ae288dfe5" }).success).toBe(true);
    expect(inviteSchema.safeParse({ ...access, email: "member@example.com" }).success).toBe(true);
  });
  it("cannot delete the current account", () => {
    expect(() => assertCanDeleteAccount("actor", "actor", true, 2)).toThrow();
  });
  it("cannot delete the final administrator", () => {
    expect(() => assertCanDeleteAccount("actor", "other", true, 1)).toThrow();
    expect(() => assertCanDeleteAccount("actor", "other", true, 2)).not.toThrow();
  });
  it("can delete another non-admin account", () => {
    expect(() => assertCanDeleteAccount("actor", "other", false, 1)).not.toThrow();
  });
  it("deletion requires a valid account ID", () => {
    expect(deleteAccountSchema.safeParse({ userId: "invalid" }).success).toBe(false);
  });
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