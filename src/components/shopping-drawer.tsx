import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useShopping, useShoppingText } from "@/components/shopping-provider";
import { fallbackImages } from "@/components/site";
import { productsQuery, settingsQuery } from "@/lib/data";
import { useLang, pick } from "@/lib/i18n";
import { cartLines, cartTotal } from "@/lib/shopping";

const money = (value: number) => `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} EGP`;

export function ShoppingDrawer() {
  const { state, panel, openPanel, quantity, favorite } = useShopping();
  const text = useShoppingText();
  const { lang } = useLang();
  const products = useQuery(productsQuery);
  const settings = useQuery(settingsQuery);
  const cart = panel !== "favorites";
  const lines = cartLines(products.data ?? [], state.cart, settings.data);
  const total = cartTotal(lines);
  const favorites = (products.data ?? []).filter((p) => p.active && state.favorites.includes(p.id));
  const close = () => openPanel(null);
  const items = cart
    ? lines.map((l) => ({ product: l.product, qty: l.quantity, price: l.total }))
    : favorites.map((p) => ({ product: p, qty: 0, price: null as number | null }));
  return <Sheet open={panel !== null} onOpenChange={(o) => !o && close()}>
    <SheetContent side={lang === "ar" ? "left" : "right"} dir={lang === "ar" ? "rtl" : "ltr"}
      className="flex w-[92vw] flex-col gap-0 border-gold/30 p-0 sm:max-w-md">
      <SheetHeader className="border-b border-border p-5 text-start">
        <SheetTitle className="flex items-center gap-3 text-xl text-gold">
          <span className="shortcut-icon">{cart ? <ShoppingBag strokeWidth={1.7} /> : <Heart strokeWidth={1.7} />}</span>
          {text(cart ? "cart" : "favorites")} <span className="text-sm text-muted-foreground">({items.length})</span>
        </SheetTitle>
        <SheetDescription className="sr-only">{text(cart ? "cart" : "favorites")}</SheetDescription>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto px-5">
        {!items.length ? <div className="flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
          {cart ? <ShoppingBag className="size-12 text-gold/50" /> : <Heart className="size-12 text-gold/50" />}
          <p>{text(cart ? "empty_cart" : "empty_favorites")}</p>
        </div> : <ul className="divide-y divide-border">
          {items.map(({ product, qty, price }) => <li key={product.id} className="flex gap-3 py-4">
            <Link to="/products/$id" params={{ id: product.id }} onClick={close} className="w-20 shrink-0">
              <img src={product.image_url || fallbackImages[0]} alt={pick(product, "name", lang)} className="aspect-square w-full rounded-md border border-border object-cover" />
            </Link>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link to="/products/$id" params={{ id: product.id }} onClick={close} className="break-words text-sm font-medium hover:text-gold">{pick(product, "name", lang)}</Link>
                <Button size="icon" variant="ghost" aria-label={text("remove")} title={text("remove")} className="size-8 shrink-0 text-muted-foreground"
                  onClick={() => cart ? quantity(product.id, 0) : favorite(product.id)}><Trash2 className="size-4" /></Button>
              </div>
              {cart && <div className="flex items-center justify-between gap-2">
                <div className="flex items-center rounded-md border border-border" aria-label={text("quantity")}>
                  <Button size="icon" variant="ghost" className="size-8" disabled={qty <= 1} aria-label={text("decrease")} onClick={() => quantity(product.id, qty - 1)}><Minus className="size-3" /></Button>
                  <span className="w-8 text-center text-sm">{qty}</span>
                  <Button size="icon" variant="ghost" className="size-8" aria-label={text("increase")} onClick={() => quantity(product.id, qty + 1)}><Plus className="size-3" /></Button>
                </div>
                <span className="text-sm font-semibold text-gold" dir={price == null ? undefined : "ltr"}>{price == null ? text("inquiry_price") : money(price)}</span>
              </div>}
            </div>
          </li>)}
        </ul>}
      </div>
      <div className="space-y-3 border-t border-gold/30 p-5">
        {cart && items.length > 0 && <div className="flex items-center justify-between">
          <span>{text("total")}</span>
          <span className="text-xl font-semibold text-gold" dir={total == null ? undefined : "ltr"}>{total == null ? text("inquiry_price") : money(total)}</span>
        </div>}
        <Button asChild className="h-11 w-full"><Link to={cart ? "/cart" : "/favorites"} onClick={close}>{cart ? <ShoppingBag /> : <Heart />}{text(cart ? "cart" : "favorites")}</Link></Button>
        <Button variant="outline" className="h-11 w-full" onClick={close}>{text("browse")}</Button>
      </div>
    </SheetContent>
  </Sheet>;
}
