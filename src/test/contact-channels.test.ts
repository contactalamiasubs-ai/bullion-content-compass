import { describe, expect, it } from "vitest";
import { contactChannels } from "@/lib/contact-channels";

describe("contact channel visibility", () => {
  it("shows only WhatsApp when selected", () => {
    expect(contactChannels("whatsapp")).toEqual({ whatsapp: true, email: false });
  });
  it("shows only email when selected", () => {
    expect(contactChannels("email")).toEqual({ whatsapp: false, email: true });
  });
  it("shows both when selected", () => {
    expect(contactChannels("both")).toEqual({ whatsapp: true, email: true });
  });
});