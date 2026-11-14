import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, ShoppingBag, Trash2, Plus, Minus, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopping, useShoppingText } from "@/components/shopping-provider";
import { ProductCard, fallbackImages } from "@/components/site";
import { productsQuery, settingsQuery, whatsappLink } from "@/lib/data";
import { useLang, pick } from "@/lib/i18n";
import { cartLines, cartTotal, cartMessage } from "@/lib/shopping";
import { validateWhatsappNumber } from "@/lib/whatsapp";

export function ShoppingPage({ mode }: { mode: "cart" | "favorites" }) {
  const { state, ready, quantity, clear } = useShopping();
  const text = useShoppingText();
  const { lang } = useLang();
  const products = useQuery(productsQuery);
  const settings = useQuery(settingsQuery);
  const [note, setNote] = useState("");
  const lines = cartLines(products.data ?? [], state.cart, settings.data);
  const total = cartTotal(lines);
  const favorites = (products.data ?? []).filter((p) => p.active && state.favorites.includes(p.id));
  const cart = mode === "cart";
  const count = cart ? lines.length : favorites.length;
  const unavailable = Object.keys(state.cart).filter((id) => !lines.some((line) => line.product.id === id));
  const loading = !ready || products.isPending || (cart && settings.isPending);
  const error = products.error || (cart ? settings.error : null);
  const number = validateWhatsappNumber(settings.data?.whatsapp_number);
  const money = (value: number) => `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })} EGP`;
  const sendLink = (intent: "order" | "inquiry") => whatsappLink(number.number,
    cartMessage(lines, lang, intent, typeof window === "undefined" ? "" : window.location.origin, note));
  return <main className="mx-auto min-h-[60vh] max-w-7xl px-4 py-10 md:py-14">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
      <h1 className="flex items-center gap-3 text-3xl font-bold text-gold">{cart ? <ShoppingBag /> : <Heart />} {text(mode)}
        <span className="text-base text-muted-foreground">({count})</span>
      </h1>
      <Button asChild variant="ghost"><Link to="/products"><ArrowRight className="ltr:rotate-180" />{text("browse")}</Link></Button>
    </div>
    {loading ? <p role="status" className="py-16 text-center text-muted-foreground">{text("loading")}</p>
      : error ? <div role="alert" className="space-y-4 py-16 text-center"><p className="text-destructive">{text("error")}</p><Button variant="outline" onClick={() => { void products.refetch(); void settings.refetch(); }}>{text("retry")}</Button></div>
      : !count ? <div className="flex flex-col items-center gap-6 py-20 text-center">
        {cart ? <ShoppingBag className="size-14 text-gold/50" /> : <Heart className="size-14 text-gold/50" />}
        <p className="text-xl text-muted-foreground">{text(cart ? "empty_cart" : "empty_favorites")}</p>
        <Button asChild><Link to="/products">{text("browse")}</Link></Button>
        {cart && unavailable.length > 0 && <Button variant="ghost" onClick={clear}>{text("clear")}</Button>}
      </div>
      : !cart ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{favorites.map((p, idx) => <ProductCard key={p.id} p={p} idx={idx} />)}</div>
      : <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 divide-y divide-border">
          {unavailable.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm text-muted-foreground"><p>{text("missing")}</p><Button variant="ghost" onClick={() => unavailable.forEach((id) => quantity(id, 0))}><Trash2 />{text("remove")}</Button></div>}
          {lines.map(({ product, quantity: qty, price, total: subtotal }) => <article key={product.id} className="flex gap-4 py-6 first:pt-0">
            <Link to="/products/$id" params={{ id: product.id }} className="w-24 shrink-0 sm:w-32"><img src={product.image_url || fallbackImages[0]} alt={pick(product, "name", lang)} className="aspect-square w-full rounded-md border border-border object-cover" /></Link>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2"><Link to="/products/$id" params={{ id: product.id }} className="break-words text-lg font-medium hover:text-gold">{pick(product, "name", lang)}</Link>
                <Button size="icon" variant="ghost" title={text("remove")} aria-label={text("remove")} onClick={() => quantity(product.id, 0)} className="shrink-0 text-muted-foreground"><Trash2 /></Button></div>
              <p className="text-sm text-muted-foreground" dir={price == null ? undefined : "ltr"}>{price == null ? text("inquiry_price") : money(price)}</p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 rounded-md border border-border" aria-label={text("quantity")}>
                  <Button size="icon" variant="ghost" disabled={qty <= 1} aria-label={text("decrease")} title={text("decrease")} onClick={() => quantity(product.id, qty - 1)}><Minus /></Button>
                  <input aria-label={text("quantity")} type="number" min="1" step="1" value={qty} onChange={(e) => { const n = Number(e.target.value); if (Number.isSafeInteger(n) && n > 0) quantity(product.id, n); }} className="h-9 w-14 bg-background text-center text-sm" />
                  <Button size="icon" variant="ghost" aria-label={text("increase")} title={text("increase")} onClick={() => quantity(product.id, qty + 1)}><Plus /></Button>
                </div>
                <p className="font-semibold text-gold" dir={subtotal == null ? undefined : "ltr"}>{subtotal == null ? text("inquiry_price") : money(subtotal)}</p>
              </div>
            </div>
          </article>)}
          <Button variant="ghost" onClick={clear} className="mt-4 text-muted-foreground"><Trash2 />{text("clear")}</Button>
        </div>
        <aside className="space-y-5 border-t border-gold/40 pt-6 lg:sticky lg:top-32">
          <div className="space-y-2"><h2 className="text-lg">{text("total")}</h2><p className="text-3xl font-semibold text-gold" dir={total == null ? undefined : "ltr"}>{total == null ? text("inquiry_price") : money(total)}</p></div>
          <p className="text-sm leading-relaxed text-muted-foreground">{text("price_note")}</p>
          <label className="block space-y-2 text-sm"><span>{text("notes")}</span><textarea maxLength={1000} rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-md border border-input bg-background p-3" /></label>
          {number.error ? <p role="alert" className="text-sm text-destructive">{text("missing_number")}</p> : <div className="space-y-3">{(["order", "inquiry"] as const).map((intent) => <Button key={intent} asChild variant={intent === "order" ? "default" : "outline"} className="h-auto min-h-11 w-full whitespace-normal py-3">
            <a href={sendLink(intent)} target="_blank" rel="noopener noreferrer" onClick={() => { try { window.__lovableEvents?.track?.("project.whatsapp_clicked", { placement: "cart" }); } catch { /* Optional analytics. */ } }}><MessageCircle />{text(intent)}</a>
          </Button>)}</div>}
        </aside>
      </div>}
  </main>;
}