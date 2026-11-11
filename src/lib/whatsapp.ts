import { parsePhoneNumberFromString } from "libphonenumber-js/max";

export function validateWhatsappNumber(value: unknown): { number: string; error: string | null } {
  const raw = typeof value === "string" ? value.trim() : "";
  const ascii = raw.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit >= "۰" ? 0x06f0 : 0x0660)));
  if (!ascii) return { number: "", error: "أدخل رقم واتساب مع كود الدولة." };
  if (!/^(?:\+|00)?[\d\s()-]+$/.test(ascii)) return { number: "", error: "أدخل رقمًا فقط مع كود الدولة، وليس رابطًا أو حروفًا." };
  const compact = ascii.replace(/[\s()-]/g, "").replace(/^00/, "+");
  const phone = parsePhoneNumberFromString(compact.startsWith("+") ? compact : `+${compact}`);
  if (!phone?.isValid()) return { number: "", error: "رقم غير صحيح؛ أدخل كود الدولة ثم الرقم دون صفر محلي (مثال: +20 10 1234 5678)." };
  return { number: phone.number.slice(1), error: null };
}