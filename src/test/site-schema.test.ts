import { describe, expect, it } from "vitest";
import { cleanRow, settingsPermissionsFor } from "@/lib/site-schema";

describe("site data rules", () => {
  it("price fields need price permission only", () => {
    expect(settingsPermissionsFor({ gold_gram_21: 5000, phone: "1" }, { gold_gram_21: 4000, phone: "1" })).toEqual(["prices"]);
  });
  it("other settings need settings permission", () => {
    expect(settingsPermissionsFor({ phone: "2" }, { phone: "1" })).toEqual(["settings"]);
  });
  it("unknown columns are dropped", () => {
    expect(cleanRow("products", { name_ar: "x", "id; DROP": 1 })).toEqual({ name_ar: "x" });
  });
});
