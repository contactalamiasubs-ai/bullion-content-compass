export type ProductPricing = {
  price: number | null;
  gram_pricing?: boolean;
  weight_grams?: number | null;
  karat?: number | null;
  making_charge?: number | null;
  pricing_metal?: string;
};
export type GramRates = { gold_gram_18?: number | null; gold_gram_21: number | null; gold_gram_24: number | null; silver_gram?: number | null };

export function productPrice(product: ProductPricing, rates?: GramRates | null): number | null {
  if (!product.gram_pricing) return product.price;
  const weight = product.weight_grams;
  const makingCharge = product.making_charge ?? 0;
  const rate =
    product.pricing_metal === "silver"
      ? rates?.silver_gram
      : product.karat === 18 ? rates?.gold_gram_18 : product.karat === 21 ? rates?.gold_gram_21 : product.karat === 24 ? rates?.gold_gram_24 : null;
  if (
    weight == null ||
    !Number.isFinite(weight) ||
    weight <= 0 ||
    rate == null ||
    !Number.isFinite(rate) ||
    rate <= 0 ||
    !Number.isFinite(makingCharge) ||
    makingCharge < 0
  )
    return null;
  const price = Math.round((weight * rate + makingCharge) * 100) / 100;
  return Number.isFinite(price) ? price : null;
}
