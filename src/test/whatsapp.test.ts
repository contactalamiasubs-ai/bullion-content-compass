import { describe, expect, it } from "vitest";
import { validateWhatsappField, validateWhatsappNumber } from "@/lib/whatsapp";
import { whatsappLink } from "@/lib/data";

describe("WhatsApp number validation", () => {
  it("normalizes international prefixes and formatting", () => {
    for (const input of ["201012345678", "+20 10 1234 5678", "0020 (10) 1234-5678"]) {
      expect(validateWhatsappNumber(input)).toEqual({ number: "201012345678", error: null });
    }
  });
  it("normalizes Arabic digits", () => {
    expect(validateWhatsappNumber("+٢٠١٠١٢٣٤٥٦٧٨")).toEqual({
      number: "201012345678",
      error: null,
    });
  });
  it("rejects local-only numbers", () => {
    expect(validateWhatsappNumber("01012345678").error).not.toBeNull();
  });
  it("rejects empty, malformed and impossible international numbers", () => {
    for (const input of [
      "",
      "https://wa.me/201012345678",
      "201012345678abc",
      "123",
      "+999123456789",
      "20+1012345678",
      "+20101234567899999",
    ]) {
      expect(validateWhatsappNumber(input).error).not.toBeNull();
    }
  });
  it("previews the exact product order destination and encoded message", () => {
    const number = validateWhatsappNumber("+20 10 1234 5678");
    const message = "مرحبًا، أريد طلب: سبيكة ذهب";
    const url = new URL(whatsappLink(number.number, message));
    expect(url.origin).toBe("https://wa.me");
    expect(url.pathname).toBe("/201012345678");
    expect(url.searchParams.get("text")).toBe(message);
  });
  it("lets an optional customer-service number stay empty", () => {
    for (const input of ["", "   ", null, undefined]) {
      expect(validateWhatsappField(input, true)).toEqual({ number: "", error: null });
    }
  });
  it("still checks the format of an optional customer-service number once typed", () => {
    expect(validateWhatsappField("+20 10 1234 5678", true)).toEqual({
      number: "201012345678",
      error: null,
    });
    for (const input of ["01012345678", "https://wa.me/201012345678", "123"]) {
      expect(validateWhatsappField(input, true).error).not.toBeNull();
    }
  });
  it("keeps a required WhatsApp number non-empty", () => {
    expect(validateWhatsappField("", false).error).not.toBeNull();
    expect(validateWhatsappField("").error).not.toBeNull();
  });
});
