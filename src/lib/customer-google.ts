import { customerAuth } from "@/lib/customer-client";

export function customerGoogleOptions(origin: string) {
  return {
    provider: "google" as const,
    options: { redirectTo: `${origin}/customer-callback`, queryParams: { prompt: "select_account" } },
  };
}

export function startCustomerGoogle(origin: string) {
  return customerAuth.auth.signInWithOAuth(customerGoogleOptions(origin));
}