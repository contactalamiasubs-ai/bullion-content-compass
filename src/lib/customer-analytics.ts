import type { Database } from "@/integrations/supabase/types";
import { readShopping } from "@/lib/shopping";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Shopping = Database["public"]["Tables"]["customer_shopping"]["Row"];
type Activity = Database["public"]["Tables"]["customer_activity"]["Row"];

export function summarizeCustomers(profiles: Profile[], shopping: Shopping[], activity: Activity[], days: number, now = new Date()) {
  const since = new Date(now); since.setUTCHours(0, 0, 0, 0); since.setUTCDate(since.getUTCDate() - days + 1);
  const selected = activity.filter(row => new Date(row.created_at) >= since && new Date(row.created_at) <= now);
  const registered = profiles.filter(row => new Date(row.created_at) >= since && new Date(row.created_at) <= now);
  const known = new Set(profiles.map(row => row.id));
  const customers: Record<string, { favorites: number; cartQuantity: number; cartProducts: number; events: number; views: number; lastActivity: string | null; shoppingUpdated: string | null }> = {};
  for (const profile of profiles) customers[profile.id] = { favorites: 0, cartQuantity: 0, cartProducts: 0, events: 0, views: 0, lastActivity: null, shoppingUpdated: null };
  const popular = new Map<string, { id: string; views: number; favorites: number; cartQuantity: number }>();
  const product = (id: string) => { let row = popular.get(id); if (!row) { row = { id, views: 0, favorites: 0, cartQuantity: 0 }; popular.set(id, row); } return row; };
  for (const row of shopping) {
    const customer = customers[row.user_id]; if (!customer) continue;
    const state = readShopping(JSON.stringify(row));
    customer.favorites = state.favorites.length; customer.cartProducts = Object.keys(state.cart).length;
    customer.cartQuantity = Object.values(state.cart).reduce((sum, n) => sum + n, 0); customer.shoppingUpdated = row.updated_at;
    for (const id of state.favorites) product(id).favorites++;
    for (const [id, quantity] of Object.entries(state.cart)) product(id).cartQuantity += quantity;
  }
  for (const row of activity) {
    const customer = customers[row.user_id]; if (!customer) continue;
    if (!customer.lastActivity || row.created_at > customer.lastActivity) customer.lastActivity = row.created_at;
  }
  const eventCounts: Record<string, number> = {};
  for (const row of selected) {
    const customer = customers[row.user_id]; if (!customer) continue;
    customer.events++; eventCounts[row.event] = (eventCounts[row.event] ?? 0) + 1;
    if (row.event === "product_viewed") { customer.views++; if (row.product_id) product(row.product_id).views++; }
  }
  const daily = Array.from({ length: days }, (_, i) => { const date = new Date(since); date.setUTCDate(date.getUTCDate() + i); return { date: date.toISOString().slice(0, 10), registrations: 0, events: 0 }; });
  const byDay = new Map(daily.map(row => [row.date, row]));
  for (const row of registered) { const day = byDay.get(row.created_at.slice(0, 10)); if (day) day.registrations++; }
  for (const row of selected) { const day = byDay.get(row.created_at.slice(0, 10)); if (day && known.has(row.user_id)) day.events++; }
  const values = Object.values(customers);
  return { total: profiles.length, registered: registered.length, active: values.filter(row => row.events > 0).length,
    withCart: values.filter(row => row.cartQuantity > 0).length, withFavorites: values.filter(row => row.favorites > 0).length,
    cartQuantity: values.reduce((sum, row) => sum + row.cartQuantity, 0), favorites: values.reduce((sum, row) => sum + row.favorites, 0),
    events: values.reduce((sum, row) => sum + row.events, 0), customers, daily, eventCounts,
    popular: [...popular.values()].sort((a, b) => b.views - a.views || b.favorites - a.favorites || b.cartQuantity - a.cartQuantity).slice(0, 10), updatedAt: now.toISOString() };
}