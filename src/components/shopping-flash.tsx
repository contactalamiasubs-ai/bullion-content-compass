import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopping, useShoppingText } from "@/components/shopping-provider";

/** Centered confirmation shown briefly after adding to cart or favorites. */
export function ShoppingFlash() {
  const { flash, dismissFlash, state } = useShopping();
  const text = useShoppingText();
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(dismissFlash, 2600);
    return () => clearTimeout(t);
  }, [flash, dismissFlash]);
  if (!flash) return null;
  const cart = flash.kind === "cart";
  const Icon = cart ? ShoppingBag : Heart;
  const count = cart ? Object.values(state.cart).reduce((a, b) => a + b, 0) : state.favorites.length;
  return <div className="pointer-events-none fixed inset-0 z-[60] grid place-items-center p-4">
    <div key={flash.key} role="status" aria-live="polite"
      className="pointer-events-auto relative flex w-64 flex-col items-center gap-4 rounded-2xl border border-gold/40 bg-card/95 p-6 text-center shadow-gold backdrop-blur animate-in fade-in zoom-in-75 duration-300">
      <button type="button" onClick={dismissFlash} aria-label="close" className="absolute end-3 top-3 text-muted-foreground hover:text-gold"><X className="size-4" /></button>
      <span className="relative grid size-20 place-items-center rounded-full border-2 border-gold bg-gold-gradient text-primary-foreground">
        <Icon className={`size-9 ${cart ? "" : "fill-current"}`} strokeWidth={1.7} />
        <span className="absolute -top-1 -end-1 grid min-w-7 place-items-center rounded-full border-2 border-card bg-background px-1 text-sm font-bold text-gold">{count}</span>
      </span>
      <p className="text-lg font-semibold text-gold">{text(cart ? "cart" : "favorites")}</p>
      <Button asChild className="h-10 w-full"><Link to={cart ? "/cart" : "/favorites"} onClick={dismissFlash}>{text(cart ? "cart" : "favorites")}</Link></Button>
    </div>
  </div>;
}
