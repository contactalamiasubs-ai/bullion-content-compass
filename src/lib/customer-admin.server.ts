import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { CUSTOMER_PROJECT_URL } from "./customer-client";

const REF = "kwulekegjrltnbwvkenz";
let cached: { client: SupabaseClient; at: number } | null = null;

// Privileged customer reads run only after the caller passed the Cloud dashboard permission check.
// The secret key is retrieved server-side with the stored management token and never leaves the server.
export async function customerAdminClient() {
  if (cached && Date.now() - cached.at < 10 * 60_000) return cached.client;
  const token = process.env["CUSTOMER_PROJECT_MANAGEMENT_TOKEN"];
  if (!token) throw new Error("اتصال قاعدة العملاء غير مضبوط");
  const response = await fetch(`https://api.supabase.com/v1/projects/${REF}/api-keys?reveal=true`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) { console.error(`Customer project key lookup failed [${response.status}]`); throw new Error("تعذر الاتصال بقاعدة العملاء"); }
  const keys = (await response.json()) as { type?: string; name?: string; api_key?: string }[];
  const key = keys.find(k => k.type === "secret")?.api_key ?? keys.find(k => k.name === "service_role")?.api_key;
  if (!key) throw new Error("تعذر الاتصال بقاعدة العملاء");
  const client = createClient(CUSTOMER_PROJECT_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  cached = { client, at: Date.now() };
  return client;
}
