import { createContext, useContext, useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { customerActionSchema } from "@/lib/customer-accounts";
import { sectionsQuery } from "@/lib/data";
import { pick, useLang } from "@/lib/i18n";
import { emptyShopping, readShopping, shoppingStorageKey, setCartQuantity, toggleFavorite, type ShoppingState } from "@/lib/shopping";

const ShoppingContext = createContext<{
  state: ShoppingState;
  ready: boolean;
  user: User | null;
  authReady: boolean;
  syncError: boolean;
  retry: () => void;
  view: (id: string) => void;
  favorite: (id: string) => void;
  add: (id: string) => void;
  quantity: (id: string, quantity: number) => void;
  clear: () => void;
} | null>(null);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShoppingState>(emptyShopping);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const actor = useRef<string | null>(null);
  const generation = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const qc = useQueryClient();
  const router = useRouter();
  const text = useShoppingText();
  const load = useCallback(async () => {
    const version = ++generation.current;
    setReady(false);
    const { data, error } = await supabase.auth.getUser();
    if (version !== generation.current) return;
    const current = data.user;
    actor.current = current?.id ?? null;
    setUser(current); setAuthReady(true);
    let guest = emptyShopping;
    try { guest = readShopping(localStorage.getItem(shoppingStorageKey)); } catch { /* Storage may be blocked. */ }
    if (!current) {
      setState(guest); setReady(true); setSyncError(false);
      return;
    }
    setState(emptyShopping);
    const result = await supabase.rpc("customer_shopping_action", { _action: "merge", _guest: { favorites: guest.favorites, cart: guest.cart } });
    if (version !== generation.current) return;
    if (error || result.error) { setSyncError(true); return; }
    setState(readShopping(JSON.stringify(result.data))); setReady(true); setSyncError(false);
    try { localStorage.removeItem(shoppingStorageKey); } catch { /* No account data is written to guest storage. */ }
  }, []);
  useEffect(() => {
    void load();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      ++generation.current; actor.current = null; setReady(false); setState(emptyShopping);
      queueMicrotask(() => {
        void load(); void router.invalidate();
        if (event !== "SIGNED_OUT") void qc.invalidateQueries();
      });
    });
    const sync = (event: StorageEvent) => {
      if (!actor.current && (event.key === shoppingStorageKey || event.key === null)) setState(readShopping(event.newValue));
      if (actor.current && event.key === "gold-center-account-changed") void load();
    };
    window.addEventListener("storage", sync);
    const focus = () => { if (actor.current) void load(); };
    window.addEventListener("focus", focus);
    return () => { ++generation.current; data.subscription.unsubscribe(); window.removeEventListener("storage", sync); window.removeEventListener("focus", focus); };
  }, [load, qc, router]);
  useEffect(() => {
    if (!ready || user) return;
    try { localStorage.setItem(shoppingStorageKey, JSON.stringify(state)); } catch { /* Keep this session usable when storage is blocked. */ }
  }, [state, ready, user]);
  const change = (action: "favorite" | "add" | "quantity" | "clear", id?: string, quantity?: number) => {
    if (!ready) return;
    if (!customerActionSchema.safeParse({ action, productId: id, quantity }).success) { toast.error(text("sync_error")); return; }
    if (!actor.current) {
      setState((prev) => action === "favorite" && id ? { ...prev, favorites: toggleFavorite(prev.favorites, id) }
        : action === "clear" ? { ...prev, cart: {} }
        : id ? { ...prev, cart: setCartQuantity(prev.cart, id, action === "add" ? (prev.cart[id] ?? 0) + 1 : quantity ?? 0) } : prev);
      return;
    }
    const owner = actor.current;
    const version = generation.current;
    queue.current = queue.current.then(async () => {
      if (actor.current !== owner || version !== generation.current) return;
      const result = await supabase.rpc("customer_shopping_action", { _action: action, ...(id ? { _product_id: id } : {}), ...(quantity !== undefined ? { _quantity: quantity } : {}) });
      if (actor.current !== owner || version !== generation.current) return;
      if (result.error) { toast.error(text("sync_error")); return; }
      setState(readShopping(JSON.stringify(result.data)));
      try { localStorage.setItem("gold-center-account-changed", String(Date.now())); } catch { /* Optional tab notification. */ }
    }).catch(() => { toast.error(text("sync_error")); });
  };
  const view = useCallback((id: string) => { if (actor.current && ready) void supabase.rpc("record_customer_view", { _product_id: id }).then(() => {}); }, [ready]);
  return <ShoppingContext.Provider value={{
    state, ready, user, authReady, syncError, retry: () => { void load(); },
    view,
    favorite: (id) => change("favorite", id),
    add: (id) => change("add", id),
    quantity: (id, quantity) => change("quantity", id, quantity),
    clear: () => change("clear"),
  }}>{children}</ShoppingContext.Provider>;
}

export function useShopping() {
  const context = useContext(ShoppingContext);
  if (!context) throw new Error("ShoppingProvider is required");
  return context;
}

export function useShoppingText() {
  const { lang } = useLang();
  const { data } = useQuery(sectionsQuery);
  return (key: string) => pick(data?.[`shopping_${key}`], "title", lang);
}