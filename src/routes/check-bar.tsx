import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { ScanLine, ShieldCheck, CircleAlert, LoaderCircle, User, Mail, Barcode, RefreshCw, CircleCheck, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sectionsQuery, settingsQuery } from "@/lib/data";
import { pick, useLang } from "@/lib/i18n";
import { customerNumberSchema, serialSchema } from "@/lib/bullion-serials";
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
const emailSchema = z.string().trim().max(255).regex(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i);
const nameSchema = z.string().trim().min(2).max(100);
const newCaptcha = () => { const a = 1 + Math.floor(Math.random() * 9), b = 1 + Math.floor(Math.random() * 9); return { a, b }; };

function CheckBar() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const sections = useQuery(sectionsQuery);
  const settings = useQuery(settingsQuery);
  const bg = settings.data;
  const text = (key: string, field = "title") => pick(sections.data?.[`serial_${key}`], field, lang);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [serial, setSerial] = useState("");
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 });
  useEffect(() => setCaptcha(newCaptcha()), []);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const emailOk = emailSchema.safeParse(email).success;
  const dots = useMemo(() => Array.from({ length: 28 }, (_, i) => ({ left: (i * 37) % 100, delay: (i * 1.3) % 10, size: 3 + (i % 4) * 2 })), []);
  const speed = `${bg?.serial_bg_speed ?? 20}s`;
  const field = "flex h-12 items-center gap-3 rounded-full border border-gold/40 bg-background/70 px-4 focus-within:ring-2 focus-within:ring-ring";
  return <main className="serial-scene relative overflow-hidden" data-style={bg?.serial_bg_style ?? "particles"} data-animated={bg?.serial_bg_enabled === false ? "false" : "true"} style={{ ["--serial-speed" as string]: speed }}>
    <div aria-hidden className="serial-bg">
      {bg?.serial_bg_image && <img src={bg.serial_bg_image} alt="" className="serial-bg-image" />}
      <div className="serial-bg-glow" />
      {dots.map((d, i) => <span key={i} className="serial-dot" style={{ left: `${d.left}%`, width: d.size, height: d.size, animationDelay: `-${d.delay * 2}s` }} />)}
    </div>
    <section className="relative mx-auto max-w-xl space-y-6 px-4 py-12">
      <div className="serial-card space-y-5 rounded-3xl border border-gold/60 bg-card/85 p-6 backdrop-blur sm:p-8">
        <div className="flex justify-center">
          <svg width="0" height="0" aria-hidden="true" className="login-logo-filter"><defs><filter id="serial-logo-transparent" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.5 1.5 1.5 1 -1.3" /></filter></defs></svg>
          {bg?.logo_url && <img src={bg.logo_url} alt={pick(bg, "site_name", lang)} width={180} height={112} className="serial-brand-logo" />}
        </div>
        <h1 className="text-center font-display text-3xl text-gold sm:text-4xl">{text("heading")}</h1>
        <p className="text-center text-muted-foreground">{text("heading", "body")}</p>
        <form className="space-y-4" noValidate onSubmit={async event => {
          event.preventDefault(); setError(""); setMatch(null); setChecked(false);
          const n = nameSchema.safeParse(name), m = emailSchema.safeParse(email), c = customerNumberSchema.safeParse(customerNumber), p = serialSchema.safeParse(serial);
          if (!n.success) { setError(ar ? "اكتب اسمك الكامل (حرفان على الأقل)" : "Enter your full name"); return; }
          if (!m.success) { setError(ar ? "البريد الإلكتروني غير صحيح" : "Invalid email address"); return; }
          if (!c.success) { setError(ar ? "اكتب رقم العميل (حرفان على الأقل)" : "Enter your customer number"); return; }
          if (!p.success) { setError(text("invalid")); return; }
          if (Number(answer) !== captcha.a + captcha.b) { setError(ar ? "إجابة التحقق غير صحيحة" : "Wrong verification answer"); setCaptcha(newCaptcha()); setAnswer(""); return; }
          setBusy(true);
          try {
            await supabase.from("bullion_checks").insert({ name: n.data, email: m.data.toLowerCase(), customer_number: c.data, serial: p.data });
            const result = await supabase.rpc("lookup_bullion_serial", { _serial: p.data });
            if (result.error) throw result.error;
            setMatch(result.data?.[0] ?? null); setChecked(true); setCaptcha(newCaptcha()); setAnswer("");
          } catch { setError(text("error")); }
          finally { setBusy(false); }
        }}>
          <label htmlFor="bar-name" className="block text-sm font-medium">{ar ? "الاسم الكامل" : "Full name"} <span className="text-destructive">*</span></label>
          <div className={field}><User className="h-5 w-5 text-gold" /><input id="bar-name" maxLength={100} value={name} disabled={busy} onChange={e => setName(e.target.value)} placeholder={ar ? "أدخل اسمك الكامل" : "Enter your full name"} className="h-full w-full bg-transparent outline-none" /></div>
          <label htmlFor="bar-email" className="block text-sm font-medium">{ar ? "البريد الإلكتروني" : "Email"} <span className="text-destructive">*</span></label>
          <div className={field}><Mail className="h-5 w-5 text-gold" /><input id="bar-email" type="email" dir="ltr" maxLength={255} value={email} disabled={busy} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" className="h-full w-full bg-transparent outline-none" />{email && (emailOk ? <CircleCheck className="h-5 w-5 text-success" aria-label="valid" /> : <CircleAlert className="h-5 w-5 text-destructive" aria-label="invalid" />)}</div>
          <label htmlFor="bar-customer" className="block text-sm font-medium">{ar ? "رقم العميل" : "Customer number"} <span className="text-destructive">*</span></label>
          <div className={field}><IdCard className="h-5 w-5 text-gold" /><input id="bar-customer" dir="ltr" autoComplete="off" maxLength={40} value={customerNumber} disabled={busy} onChange={e => setCustomerNumber(e.target.value)} placeholder={ar ? "أدخل رقم العميل" : "Enter your customer number"} className="h-full w-full bg-transparent outline-none" /></div>
          <label htmlFor="bar-serial" className="block text-sm font-medium">{text("input")} <span className="text-destructive">*</span></label>
          <div className={field}><Barcode className="h-5 w-5 text-gold" /><input id="bar-serial" dir="ltr" autoComplete="off" maxLength={100} value={serial} disabled={busy} onChange={e => { setSerial(e.target.value); setChecked(false); setMatch(null); }} className="h-full w-full bg-transparent outline-none" /></div>
          <label htmlFor="bar-captcha" className="block text-sm font-medium">{ar ? "تحقق أنك لست روبوتًا" : "Verify you are human"} <span className="text-destructive">*</span></label>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/60 p-3">
            <span dir="ltr" className="rounded-md bg-background px-3 py-2 font-mono text-lg tracking-widest select-none">{captcha.a} + {captcha.b} =</span>
            <input id="bar-captcha" inputMode="numeric" dir="ltr" maxLength={2} value={answer} disabled={busy} onChange={e => setAnswer(e.target.value.replace(/\D/g, ""))} className="h-10 w-20 rounded-md border border-input bg-background px-3 text-center" />
            <Button type="button" variant="ghost" size="icon" aria-label={ar ? "سؤال جديد" : "New question"} onClick={() => { setCaptcha(newCaptcha()); setAnswer(""); }}><RefreshCw /></Button>
          </div>
          <Button type="submit" disabled={busy || sections.isLoading || !!sections.error} className="h-12 w-full rounded-full text-base">{busy ? <LoaderCircle className="animate-spin" /> : <ScanLine />}{text(busy ? "busy" : "submit")}</Button>
        </form>
        {(error || sections.error) && <p role="alert" className="text-destructive">{error || (ar ? "تعذر تحميل الصفحة" : "Unable to load page")}</p>}
        {checked && <div role="status" className="space-y-5 border-t border-border pt-6">
          <h2 className={`flex items-center gap-3 text-xl ${match ? "text-success" : "text-muted-foreground"}`}>{match ? <ShieldCheck /> : <CircleAlert />}{text(match ? "match" : "missing")}</h2>
          {match ? <dl className="grid gap-4 sm:grid-cols-2">
            {[[text("input"), match.serial], [text("name"), pick(match, "name", lang)], [text("weight"), String(match.weight_grams)], [text("purity"), match.purity], [text("specs"), pick(match, "specifications", lang)]].map(([label, value], index) => <div key={label} className="min-w-0 border-b border-border py-3"><dt className="text-sm text-muted-foreground">{label}</dt><dd dir={index === 0 ? "ltr" : undefined} className="mt-2 break-words whitespace-pre-wrap font-medium">{value || "—"}</dd></div>)}
          </dl> : <p className="text-muted-foreground">{text("missing", "body")}</p>}
        </div>}
        <p className="border-t border-border pt-5 text-sm leading-7 text-muted-foreground">{text("disclaimer", "body")}</p>
      </div>
    </section>
  </main>;
}
