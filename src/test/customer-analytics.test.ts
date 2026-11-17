import { describe, expect, it } from "vitest";
import { summarizeCustomers } from "@/lib/customer-analytics";
describe("customer analytics", () => {
  const profiles = [{ id: "a", email: "", display_name: "", avatar_url: null, created_at: "2026-11-17T08:00:00Z" }, { id: "b", email: "", display_name: "", avatar_url: null, created_at: "2026-09-01T00:00:00Z" }];
  const shopping = [{ user_id: "a", cart: { p: 3 }, favorites: ["p"], updated_at: "2026-11-17T09:00:00Z" }];
  const activity = [{ id: "1", user_id: "a", event: "product_viewed", product_id: "p", quantity: null, created_at: "2026-11-17T09:00:00Z" }, { id: "2", user_id: "b", event: "cart_added", product_id: "p", quantity: 2, created_at: "2026-09-01T09:00:00Z" }];
  it("counts current shopping quantities rather than treating carts as completed orders", () => {
    const result = summarizeCustomers(profiles, shopping, activity, 7, new Date("2026-11-17T10:00:00Z"));
    expect(result.total).toBe(2); expect(result.withCart).toBe(1); expect(result.cartQuantity).toBe(3); expect(result.favorites).toBe(1);
    expect(result.popular[0]).toEqual({ id: "p", views: 1, favorites: 1, cartQuantity: 3 });
  });
  it("filters activity and registrations to the selected UTC period without losing historical last activity", () => {
    const result = summarizeCustomers(profiles, shopping, activity, 7, new Date("2026-11-17T10:00:00Z"));
    expect(result.registered).toBe(1); expect(result.active).toBe(1); expect(result.events).toBe(1);
    expect(result.customers["b"]?.lastActivity).toBe("2026-09-01T09:00:00Z");
    expect(result.daily).toHaveLength(7); expect(result.daily[6]).toEqual({ date: "2026-11-17", registrations: 1, events: 1 });
  });
});