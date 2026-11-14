import { CheckCircle2, CircleOff, MessageCircle, Clock3 } from "lucide-react";
import { productAvailability } from "@/lib/product-availability";
import { useShoppingText } from "@/components/shopping-provider";

const states = {
  available: { icon: CheckCircle2, tone: "text-success border-success/30" },
  unavailable: { icon: CircleOff, tone: "text-muted-foreground border-border" },
  reservation: { icon: MessageCircle, tone: "text-gold border-gold/30" },
  coming_soon: { icon: Clock3, tone: "text-silver border-silver/30" },
};

export function ProductAvailability({ value }: { value?: string | null | undefined }) {
  const text = useShoppingText();
  const state = productAvailability(value);
  const { icon: Icon, tone } = states[state];
  return <span className={`mb-3 inline-flex max-w-full items-center gap-2 rounded-md border bg-background px-2.5 py-1.5 text-xs ${tone}`}>
    <Icon className="size-4 shrink-0" aria-hidden="true" />
    <span>{text(state)}</span>
  </span>;
}