import { describe, expect, it } from "vitest";
import { bullionHeaders, customerNumberSchema, parseBullionRows, serialSchema } from "@/lib/bullion-serials";
import { canAccessTab } from "@/lib/dashboard-permissions";
describe("bar serial registry", () => {
  it("preserves leading zeros for exact matching", () => { expect(serialSchema.parse(" 001-ab ")).toBe("001-AB"); expect(serialSchema.parse("001-AB")).not.toBe(serialSchema.parse("1-AB")); });
  it("imports matching serial specifications from the sheet", () => { expect(parseBullionRows([bullionHeaders, ["001GC", "سبيكة ذهب", "Gold bar", 10, "999.9", "مختومة", "Sealed"]])[0]).toMatchObject({ serial: "001GC", weight_grams: 10, purity: "999.9", specifications_ar: "مختومة" }); });
  it("rejects duplicate serials rather than choosing ambiguous specifications", () => { expect(() => parseBullionRows([bullionHeaders, ["GC1", "ذهب", "", 10, "24"], ["gc1", "ذهب", "", 20, "24"]])).toThrow("مكرر"); });
  it("rejects numeric serial cells that may have lost leading zeros", () => { expect(() => parseBullionRows([bullionHeaders, [123, "ذهب", "", 10, "24"]])).toThrow("كنص"); });
  it("restricts registry management to serial permission", () => { expect(canAccessTab({ admin: false, permissions: ["serials"] }, "serials")).toBe(true); expect(canAccessTab({ admin: false, permissions: ["products"] }, "serials")).toBe(false); expect(canAccessTab({ admin: false, permissions: ["content"] }, "serials")).toBe(false); });
  it("requires a customer number on bar checks", () => { expect(customerNumberSchema.parse(" gc-1024 ")).toBe("GC-1024"); expect(customerNumberSchema.safeParse("").success).toBe(false); expect(customerNumberSchema.safeParse("1").success).toBe(false); });
  it("rejects customer numbers that are too long or hold unexpected symbols", () => { expect(customerNumberSchema.safeParse("A".repeat(41)).success).toBe(false); expect(customerNumberSchema.safeParse("عميل 12").success).toBe(false); expect(customerNumberSchema.safeParse("a,b").success).toBe(false); });
});