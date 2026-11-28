import { describe, expect, it } from "vitest";
import { passwordStrength } from "@/components/login-panel";
describe("passwordStrength", () => {
  it("rates short passwords weak", () => expect(passwordStrength("abc123")).toBe(1));
  it("rates mixed long passwords strong", () => expect(passwordStrength("Abcdef12345!x")).toBe(3));
});
