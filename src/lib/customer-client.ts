import { createClient } from "@supabase/supabase-js";

// Customer accounts, profiles, carts and activity live in the owner's separate project.
// The publishable key is public by design; every table is protected by row-level security there.
export const CUSTOMER_PROJECT_URL = "https://kwulekegjrltnbwvkenz.supabase.co";
export const CUSTOMER_PUBLISHABLE_KEY = "sb_publishable_zUFgZrTY7J5EDjrgO3uKZw_LDx1dklL";

export const customerAuth = createClient(CUSTOMER_PROJECT_URL, CUSTOMER_PUBLISHABLE_KEY, {
  auth: { storageKey: "gold-center-customer-auth", persistSession: typeof window !== "undefined", autoRefreshToken: typeof window !== "undefined", detectSessionInUrl: typeof window !== "undefined", flowType: "pkce" },
});
