import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, LoaderCircle } from "lucide-react";
import { useLang, pick } from "@/lib/i18n";
import { sectionsQuery } from "@/lib/data";
import { recommendProducts } from "@/lib/recommendations.functions";
import { recommendationInput, type RecommendationResult } from "@/lib/recommendations";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site";

export function ProductAssistant() {
  const { lang } = useLang();
  const { data: sections } = useQuery(sectionsQuery);
  const recommend = useServerFn(recommendProducts);
  const [needs, setNeeds] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const label = (key: string) => pick(sections?.[`assistant_${key}`], "title", lang);
  if (!sections?.["assistant_title"]) return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const input = recommendationInput.safeParse({ needs, budget: Number(budget), lang });
    setInvalid(!input.success);
    if (!input.success) return;
    setBusy(true);
    setResult(null);
    try {
      setResult(await recommend({ data: input.data }));
    } catch {
      setResult({ items: [], error: "unavailable" });
    } finally {
      setBusy(false);
    }
  }
  return (
    <section aria-labelledby="assistant-title" className="mb-10 border-y border-gold/30 py-7">
      <h2
        id="assistant-title"
        className="mb-5 flex items-center gap-3 text-2xl font-semibold text-gold"
      >
        <Sparkles aria-hidden="true" className="size-6" />
        {label("title")}
      </h2>
      <form
        onSubmit={submit}
        className="grid items-start gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        <label className="space-y-2 text-sm">
          <span>{label("needs")}</span>
          <textarea
            required
            minLength={3}
            maxLength={1200}
            rows={3}
            value={needs}
            disabled={busy}
            onChange={(event) => setNeeds(event.target.value)}
            placeholder={label("placeholder")}
            className="block w-full rounded-md border border-input bg-background px-3 py-3 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </label>
        <div className="space-y-3">
          <label className="block space-y-2 text-sm">
            <span>{label("budget")}</span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={budget}
              disabled={busy}
              onChange={(event) => setBudget(event.target.value)}
              className="block w-full rounded-md border border-input bg-background px-3 py-3 text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </label>
          <Button
            disabled={busy}
            type="submit"
            className="min-h-11 h-auto w-full whitespace-normal py-2"
          >
            {busy ? <LoaderCircle className="motion-safe:animate-spin" /> : <Sparkles />}
            {label(busy ? "loading" : "submit")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground md:col-span-2">{label("privacy")}</p>
      </form>
      <div aria-live="polite" aria-busy={busy} className="mt-4">
        {invalid && (
          <p role="alert" className="text-sm text-destructive">
            {label("invalid")}
          </p>
        )}
        {result?.error && (
          <p role="alert" className="text-sm text-destructive">
            {label(
              result.error === "credits"
                ? "credits"
                : result.error === "refusal"
                  ? "refusal"
                  : "error",
            )}
          </p>
        )}
        {result &&
          !result.error &&
          (result.items.length ? (
            <>
              <h3 className="mb-4 text-lg font-semibold">{label("results")}</h3>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {result.items.map((item, index) => (
                  <div key={item.product.id} className="min-w-0">
                    <ProductCard p={item.product} idx={index} />
                    <p className="mt-3 break-words text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-muted-foreground">{label("notice")}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{label("empty")}</p>
          ))}
      </div>
    </section>
  );
}
