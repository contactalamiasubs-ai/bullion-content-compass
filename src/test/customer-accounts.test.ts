import { describe, it, expect } from "vitest";
import { customerActionSchema } from "@/lib/customer-accounts";
import { canAccessTab } from "@/lib/dashboard-permissions";
describe("customer shopping actions", () => {
  it("limits customer inspection to full administrators", () => {
    expect(canAccessTab({ admin: false, permissions: [] }, "customers")).toBe(false);
    expect(canAccessTab({ admin: false, permissions: ["products", "settings"] }, "customers")).toBe(false);
    expect(canAccessTab({ admin: true, permissions: [] }, "customers")).toBe(true);
  });
  it("allows favorite and cart actions for actual product ids", () => {
    expect(customerActionSchema.parse({ action: "favorite", productId: "123e4567-e89b-12d3-a456-426614174000" }).action).toBe("favorite");
    expect(customerActionSchema.parse({ action: "quantity", quantity: 2 }).quantity).toBe(2);
  });
  it("rejects invalid quantities and product identities", () => {
    expect(customerActionSchema.safeParse({ action: "quantity", quantity: -1 }).success).toBe(false);
    expect(customerActionSchema.safeParse({ action: "add", productId: "another-account" }).success).toBe(false);
  });
});