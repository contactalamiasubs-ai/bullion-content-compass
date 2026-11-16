import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { sectionsQuery } from "@/lib/data";
import { pick, useLang } from "@/lib/i18n";
import { emptyShopping, readShopping, shoppingStorageKey, setCartQuantity, toggleFavorite, type ShoppingState } from "@/lib/shopping";

const ShoppingContext = createContext<{
  state: ShoppingState;
  ready: boolean;
  favorite: (id: string) => void;
  add: (id: string) => void;
  quantity: (id: string, quantity: number) => void;
  clear: () => void;
  panel: "cart" | "favorites" | null;
  openPanel: (panel: "cart" | "favorites" | null) => void;
} | null>(null);

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ShoppingState>(emptyShopping);
  const [ready, setReady] = useState(false);
  const [panel, openPanel] = useState<"cart" | "favorites" | null>(null);
  useEffect(() => {
    try { setState(readShopping(localStorage.getItem(shoppingStorageKey))); } catch { /* Private browsing can block storage. */ }
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === shoppingStorageKey || event.key === null) setState(readShopping(event.newValue));
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(shoppingStorageKey, JSON.stringify(state)); } catch { /* Keep this session usable when storage is blocked. */ }
  }, [state, ready]);
  return <ShoppingContext.Provider value={{
    state, ready, panel, openPanel,
    favorite: (id) => {
      if (!state.favorites.includes(id)) openPanel("favorites");
      setState((prev) => ({ ...prev, favorites: toggleFavorite(prev.favorites, id) }));
    },
    add: (id) => {
      openPanel("cart");
      setState((prev) => ({ ...prev, cart: setCartQuantity(prev.cart, id, (prev.cart[id] ?? 0) + 1) }));
    },
    quantity: (id, quantity) => setState((prev) => ({ ...prev, cart: setCartQuantity(prev.cart, id, quantity) })),
    clear: () => setState((prev) => ({ ...prev, cart: {} })),
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