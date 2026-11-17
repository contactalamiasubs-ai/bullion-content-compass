import { expect, it } from "vitest";
import { customerExportSheets } from "@/lib/customer-export";
it("exports every customer with separate shopping/activity rows and preserves unsafe-looking text as strings", () => {
  const data = { profiles: Array.from({ length: 21 }, (_, i) => ({ id: String(i), display_name: "=1+1", email: `${i}@test.invalid`, avatar_url: null, created_at: "2026-11-17T00:00:00Z" })), shopping: [{ user_id: "0", favorites: ["p"], cart: { p: 3 }, updated_at: "2026-11-17T00:00:00Z" }], activity: [{ id: "e", user_id: "0", event: "cart_added", product_id: "p", quantity: 3, created_at: "2026-11-17T00:00:00Z" }], products: [{ id: "p", name_ar: "منتج" }], exportedAt: "2026-11-17T00:00:00Z" };
  const sheets = customerExportSheets(data);
  expect(sheets[0]?.rows).toHaveLength(21); expect(sheets[0]?.rows[0]?.[1]).toBe("=1+1");
  expect(sheets[1]?.rows[0]?.[4]).toBe(3); expect(sheets[2]?.rows).toHaveLength(1); expect(sheets[3]?.rows).toHaveLength(1);
});