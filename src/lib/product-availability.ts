export const availabilityStates = ["available", "unavailable", "reservation", "coming_soon"] as const;
export type Availability = (typeof availabilityStates)[number];

export function productAvailability(value?: string | null): Availability {
  return availabilityStates.find((state) => state === value) ?? "available";
}

export function canOrderProduct(product: { availability?: string | null }) {
  return productAvailability(product.availability) === "available";
}