import { Heart, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopping, useShoppingText } from "@/components/shopping-provider";

export function FavoriteButton({ id }: { id: string }) {
  const { state, favorite, ready } = useShopping();
  const text = useShoppingText();
  const selected = state.favorites.includes(id);
  const label = text(selected ? "remove_favorite" : "add_favorite");
  return <Button type="button" size="icon" variant="outline" disabled={!ready}
    aria-label={label} title={label} aria-pressed={selected} onClick={() => favorite(id)}
    className={selected ? "shrink-0 border-gold bg-background text-gold" : "shrink-0 bg-background text-muted-foreground"}>
    <Heart className={selected ? "fill-current" : ""} />
  </Button>;
}

export function AddToCartButton({ id }: { id: string }) {
  const { state, add, ready } = useShopping();
  const text = useShoppingText();
  const count = state.cart[id] ?? 0;
  return <Button type="button" variant="outline" disabled={!ready} onClick={() => add(id)}
    aria-label={text("add_cart")} className="h-auto min-h-10 w-full whitespace-normal border-gold/40 text-gold">
    {count ? <Check /> : <ShoppingBag />}
    <span>{text(count ? "add_more" : "add_cart")}{count > 0 && ` (${count})`}</span>
  </Button>;
}