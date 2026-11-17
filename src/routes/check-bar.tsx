import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ScanLine, ShieldCheck, CircleAlert, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/site";
import { sectionsQuery } from "@/lib/data";
import { pick, useLang } from "@/lib/i18n";
import { serialSchema } from "@/lib/bullion-serials";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Match = Database["public"]["Functions"]["lookup_bullion_serial"]["Returns"][number];
export const Route = createFileRoute("/check-bar")({
  head: () => ({ meta: [
    { title: "افحص سبيكتك | جولد سنتر" },
    { name: "description", content: "تحقق من سيريال السبيكة واستعرض مواصفاتها المسجلة لدى جولد سنتر." },
    { property: "og:title", content: "افحص سبيكتك | جولد سنتر" },
    { property: "og:description", content: "مطابقة سيريال السبيكة مع سجل جولد سنتر ومواصفاتها." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: CheckBar,
});
function CheckBar() {
  const { lang } = useLang();
  const sections = useQuery(sectionsQuery);
  const text = (key: string, field = "title") => pick(sections.data?.[`serial_${key}`], field, lang);
  const [serial, setSerial] = useState("");
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  return <main>
    <PageHero title={text("heading")} centered />
    <section className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <p className="text-center text-muted-foreground">{text("heading", "body")}</p>
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault(); setError(""); setMatch(null); setChecked(false);
        const parsed = serialSchema.safeParse(serial);
        if (!parsed.success) { setError(text("invalid")); return; }
        setBusy(true);
        try {
          const result = await supabase.rpc("lookup_bullion_serial", { _serial: parsed.data });
          if (result.error) throw result.error;
          setMatch(result.data?.[0] ?? null); setChecked(true);
        } catch { setError(text("error")); }
        finally { setBusy(false); }
      }}>
        <label htmlFor="bar-serial" className="block text-sm font-medium">{text("input")}</label>
        <input id="bar-serial" dir="ltr" autoComplete="off" maxLength={100} required value={serial} disabled={busy} onChange={event => { setSerial(event.target.value); setChecked(false); setMatch(null); setError(""); }} className="h-12 w-full rounded-md border border-input bg-background px-4 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        <Button type="submit" disabled={busy || sections.isLoading || !!sections.error} className="h-12 w-full">{busy ? <LoaderCircle className="animate-spin" /> : <ScanLine />}{text(busy ? "busy" : "submit")}</Button>
      </form>
      {(error || sections.error) && <p role="alert" className="text-destructive">{error || (lang === "ar" ? "تعذر تحميل الصفحة" : "Unable to load page")}</p>}
      {checked && <div role="status" className="space-y-5 border-t border-border pt-6">
        <h2 className={`flex items-center gap-3 text-xl ${match ? "text-success" : "text-muted-foreground"}`}>{match ? <ShieldCheck /> : <CircleAlert />}{text(match ? "match" : "missing")}</h2>
        {match ? <dl className="grid gap-4 sm:grid-cols-2">
          {[[text("input"), match.serial], [text("name"), pick(match, "name", lang)], [text("weight"), String(match.weight_grams)], [text("purity"), match.purity], [text("specs"), pick(match, "specifications", lang)]].map(([label, value], index) => <div key={label} className="min-w-0 border-b border-border py-3"><dt className="text-sm text-muted-foreground">{label}</dt><dd dir={index === 0 ? "ltr" : undefined} className="mt-2 break-words whitespace-pre-wrap font-medium">{value || "—"}</dd></div>)}
        </dl> : <p className="text-muted-foreground">{text("missing", "body")}</p>}
      </div>}
      <p className="border-t border-border pt-5 text-sm leading-7 text-muted-foreground">{text("disclaimer", "body")}</p>
    </section>
  </main>;
}