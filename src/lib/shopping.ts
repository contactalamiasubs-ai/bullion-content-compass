import { productPrice, type GramRates, type ProductPricing } from "@/lib/product-pricing";

export type ShoppingState = { favorites: string[]; cart: Record<string, number> };
export const emptyShopping: ShoppingState = { favorites: [], cart: {} };
export const shoppingStorageKey = "gold-center-shopping-v1";

export function readShopping(raw: string | null): ShoppingState {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (!value || typeof value !== "object") return emptyShopping;
    const data = value as Record<string, unknown>;
    const favorites = Array.isArray(data["favorites"])
      ? [...new Set(data["favorites"].filter((id): id is string => typeof id === "string" && id.length > 0))]
      : [];
    const cart: Record<string, number> = {};
    if (data["cart"] && typeof data["cart"] === "object" && !Array.isArray(data["cart"])) {
      for (const [id, quantity] of Object.entries(data["cart"])) {
        if (id && typeof quantity === "number" && Number.isSafeInteger(quantity) && quantity > 0)
          Object.defineProperty(cart, id, { value: quantity, enumerable: true, writable: true, configurable: true });
      }
    }
    return { favorites, cart };
  } catch {
    return emptyShopping;
  }
}

export function setCartQuantity(cart: Record<string, number>, id: string, quantity: number) {
  const next = { ...cart };
  if (!Number.isSafeInteger(quantity) || quantity < 0) return next;
  if (quantity === 0) delete next[id];
  else Object.defineProperty(next, id, { value: quantity, enumerable: true, writable: true, configurable: true });
  return next;
}

export function toggleFavorite(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

type CartProduct = ProductPricing & { id: string; active: boolean; name_ar: string; name_en: string };
export function cartLines<T extends CartProduct>(products: T[], cart: Record<string, number>, rates?: GramRates | null) {
  return products.filter((p) => p.active && (cart[p.id] ?? 0) > 0).map((product) => {
    const quantity = cart[product.id] ?? 0;
    const price = productPrice(product, rates);
    return { product, quantity, price, total: price == null ? null : Math.round(price * quantity * 100) / 100 };
  });
}

export type CartLine = ReturnType<typeof cartLines>[number];
export function cartTotal(lines: CartLine[]): number | null {
  if (lines.some((line) => line.total == null || !Number.isFinite(line.total))) return null;
  return Math.round(lines.reduce((total, line) => total + (line.total ?? 0), 0) * 100) / 100;
}

export function cartMessage(lines: CartLine[], lang: "ar" | "en", intent: "order" | "inquiry", origin: string, note: string) {
  const ar = lang === "ar";
  const heading = intent === "order"
    ? (ar ? "مرحبًا، أريد طلب المنتجات التالية:" : "Hello, I would like to order these products:")
    : (ar ? "مرحبًا، أريد الاستفسار عن المنتجات التالية:" : "Hello, I would like to inquire about these products:");
  const money = (amount: number) => `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} EGP`;
  const rows = lines.map(({ product, quantity, price, total }, i) => [
    `${i + 1}. ${ar ? product.name_ar : product.name_en || product.name_ar}`,
    `${ar ? "الكمية" : "Quantity"}: ${quantity}`,
    `${ar ? "سعر القطعة" : "Unit price"}: ${price == null ? (ar ? "حسب الاستفسار" : "On inquiry") : money(price)}`,
    `${ar ? "الإجمالي" : "Subtotal"}: ${total == null ? (ar ? "حسب الاستفسار" : "On inquiry") : money(total)}`,
    `${origin}/products/${encodeURIComponent(product.id)}`,
  ].join("\n"));
  const total = cartTotal(lines);
  return [heading, ...rows, `${ar ? "إجمالي المنتجات" : "Products total"}: ${total == null ? (ar ? "يُحدد بعد تأكيد الأسعار" : "Pending price confirmation") : money(total)}`,
    ar ? "يرجى تأكيد السعر والتوافر." : "Please confirm pricing and availability.",
    note.trim() ? `${ar ? "ملاحظات" : "Notes"}: ${note.trim()}` : "",
  ].filter(Boolean).join("\n\n");
}