import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Menu, X, MessageCircle, Phone, Mail, MapPin, Facebook, Instagram, Youtube, ChevronLeft, ChevronRight, LockKeyhole, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang, pick } from "@/lib/i18n";
import { settingsQuery, slidesQuery, pricesQuery, historyQuery, verifiedPricesQuery, whatsappLink, calcZakat } from "@/lib/data";
import s1 from "@/assets/slide-1.jpg";
import s2 from "@/assets/slide-2.jpg";
import s3 from "@/assets/slide-3.jpg";
import s4 from "@/assets/slide-4.jpg";

export const fallbackImages = [s1, s2, s3, s4];
const fmt = (n: number, lang: string) => Number(n).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 });

export function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-10 text-center">
      {eyebrow && <p className="mb-2 text-sm tracking-widest text-gold">{eyebrow}</p>}
      <h2 className="text-3xl font-bold md:text-4xl text-gold-gradient">{title}</h2>
      <div className="mx-auto mt-4 h-px w-24 bg-gold-gradient" />
    </div>
  );
}

export function Header() {
  const { t, lang, setLang } = useLang();
  const { data: s } = useQuery(settingsQuery);
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/", l: t("home") },
    { to: "/about", l: t("about") },
    { to: "/services", l: t("services") },
    { to: "/products", l: t("products") },
    { to: "/blog", l: t("blog") },
    { to: "/news", l: t("news") },
    { to: "/contact", l: t("contact") },
  ] as const;
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="border-b border-border/60 bg-card">
        <div className="mx-auto flex max-w-7xl justify-end px-4 py-1">
          <Button asChild variant="ghost" size="sm" className="text-gold">
            <Link to="/admin" onClick={() => setOpen(false)}>
              <LockKeyhole aria-hidden="true" />
              {lang === "ar" ? "لوحة التحكم" : "Dashboard"}
            </Link>
          </Button>
        </div>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          {s?.logo_url ? (
            <img src={s.logo_url} alt={pick(s, "site_name", lang)} className="h-10 w-auto" />
          ) : (
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-gradient font-display text-lg font-bold text-primary-foreground">Au</span>
          )}
          <span className="font-display text-xl font-bold text-gold-gradient">{pick(s, "site_name", lang)}</span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((x) => (
            <Link key={x.to} to={x.to} className="text-sm text-muted-foreground transition hover:text-gold" activeProps={{ className: "text-gold" }} activeOptions={{ exact: x.to === "/" }}>
              {x.l}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-gold hover:text-gold">
            {lang === "ar" ? "EN" : "عربي"}
          </button>
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 lg:hidden">
          {links.map((x) => (
            <Link key={x.to} to={x.to} onClick={() => setOpen(false)} className="py-2 text-muted-foreground hover:text-gold">
              {x.l}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { t, lang } = useLang();
  const { data: s } = useQuery(settingsQuery);
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="mb-3 text-2xl text-gold-gradient">{pick(s, "site_name", lang)}</h3>
          <p className="text-sm text-muted-foreground">{pick(s, "address", lang)}</p>
          <div className="mt-4 flex gap-3">
            {s?.facebook && <a href={s.facebook} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-gold"><Facebook /></a>}
            {s?.instagram && <a href={s.instagram} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-gold"><Instagram /></a>}
            {s?.youtube && <a href={s.youtube} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-gold"><Youtube /></a>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Link to="/about" className="text-muted-foreground hover:text-gold">{t("about")}</Link>
          <Link to="/services" className="text-muted-foreground hover:text-gold">{t("services")}</Link>
          <Link to="/products" className="text-muted-foreground hover:text-gold">{t("products")}</Link>
          <Link to="/blog" className="text-muted-foreground hover:text-gold">{t("blog")}</Link>
          <Link to="/news" className="text-muted-foreground hover:text-gold">{t("news")}</Link>
          <Link to="/contact" className="text-muted-foreground hover:text-gold">{t("contact")}</Link>
          <Link to="/admin" className="text-muted-foreground hover:text-gold">{lang === "ar" ? "لوحة التحكم" : "Dashboard"}</Link>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {s?.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> <span dir="ltr">{s.phone}</span></p>}
          {s?.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> {s.email}</p>}
          <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> {pick(s, "address", lang)}</p>
        </div>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {pick(s, "site_name", lang)} — {t("rights")}
      </p>
      {s?.whatsapp_number && (
        <a href={whatsappLink(s.whatsapp_number, "")} onClick={() => window.__lovableEvents?.track?.("project.whatsapp_clicked", { placement: "floating" })} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="fixed bottom-5 end-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-success text-primary-foreground shadow-gold">
          <MessageCircle />
        </a>
      )}
    </footer>
  );
}

export function Popup() {
  const { lang, t } = useLang();
  const { data: s } = useQuery(settingsQuery);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (s?.popup_enabled && !sessionStorage.getItem("popup_seen")) setOpen(true);
  }, [s?.popup_enabled]);
  if (!open || !s) return null;
  const close = () => { sessionStorage.setItem("popup_seen", "1"); setOpen(false); };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" onClick={close}>
      <div className="relative w-full max-w-md rounded-xl border border-gold/40 bg-card p-8 text-center shadow-gold" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} className="absolute end-3 top-3 text-muted-foreground hover:text-gold" aria-label={t("close")}><X /></button>
        <h3 className="mb-6 text-2xl text-gold-gradient">{pick(s, "popup_title", lang)}</h3>
        <a href={s.popup_link ?? "#"} target="_blank" rel="noreferrer" className="inline-block rounded-md bg-gold-gradient px-6 py-2.5 font-semibold text-primary-foreground">
          {pick(s, "popup_button", lang)}
        </a>
      </div>
    </div>
  );
}

export function HeroSlider() {
  const { lang } = useLang();
  const { data: slides = [] } = useQuery(slidesQuery);
  const active = slides.filter((x) => x.active);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (active.length < 2) return;
    const id = setInterval(() => setI((p) => (p + 1) % active.length), 6000);
    return () => clearInterval(id);
  }, [active.length]);
  if (!active.length) return <div className="h-[70vh] bg-card" />;
  const cur = active[i % active.length];
  if (!cur) return null;
  const go = (d: number) => setI((p) => (p + d + active.length) % active.length);
  return (
    <section className="relative h-[75vh] min-h-[480px] overflow-hidden">
      {active.map((sl, idx) => (
        <img key={sl.id} src={sl.image_url || fallbackImages[idx % 4]} alt={pick(sl, "title", lang)} width={1920} height={912}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${idx === i % active.length ? "opacity-100" : "opacity-0"}`} />
      ))}
      <div className="absolute inset-0 bg-hero-fade" />
      <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-28">
        <div key={cur.id} className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="mb-4 text-4xl font-bold leading-tight md:text-6xl text-gold-gradient">{pick(cur, "title", lang)}</h1>
          <p className="mb-6 text-lg text-foreground/85">{pick(cur, "body", lang)}</p>
          {pick(cur, "button", lang) && (
            <a href={cur.link ?? "#"} className="inline-block rounded-md bg-gold-gradient px-7 py-3 font-semibold text-primary-foreground shadow-gold">{pick(cur, "button", lang)}</a>
          )}
        </div>
      </div>
      <div className="absolute bottom-14 left-1/2 flex -translate-x-1/2 items-center gap-3">
        <button onClick={() => go(-1)} className="rounded-full border border-border p-1.5 hover:border-gold" aria-label="prev"><ChevronRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" /></button>
        {active.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)} aria-label={`slide ${idx + 1}`} className={`h-1.5 rounded-full transition-all ${idx === i % active.length ? "w-8 bg-gold" : "w-3 bg-muted-foreground/50"}`} />
        ))}
        <button onClick={() => go(1)} className="rounded-full border border-border p-1.5 hover:border-gold" aria-label="next"><ChevronLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" /></button>
      </div>
    </section>
  );
}

export function PriceTicker() {
  const { t, lang } = useLang();
  const { data: s } = useQuery(settingsQuery);
  const { data: audits = [] } = useQuery(verifiedPricesQuery);
  const audit = audits[0];
  const verified = audit && Number(audit.gold_usd) === Number(s?.gold_usd) && Number(audit.silver_usd) === Number(s?.silver_usd);
  if (!s) return null;
  return (
    <div className="mx-auto -mt-10 grid max-w-4xl grid-cols-2 gap-4 px-4 relative z-10">
      {[
        { l: t("goldPrice"), v: s.gold_usd },
        { l: t("silverPrice"), v: s.silver_usd },
      ].map((x) => (
        <div key={x.l} className="rounded-xl border border-gold/30 bg-card p-5 text-center shadow-gold">
          <p className="text-sm text-muted-foreground">{x.l}</p>
          <p className="my-1 font-display text-3xl font-bold text-gold-gradient" dir="ltr">{fmt(x.v, "en")} USD</p>
          <p className="text-xs text-muted-foreground">{t("perOz")}</p>
        </div>
      ))}
      <div className="col-span-2 text-center text-xs text-muted-foreground">
        {verified ? <>
          <p>{t("lastUpdate")}: {new Date(audit.verified_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { timeZone: "Africa/Cairo" })}</p>
          <a className="text-gold underline" href={audit.gold_source_url} target="_blank" rel="noreferrer">Gold API · XAU</a>{" · "}
          <a className="text-gold underline" href={audit.silver_source_url} target="_blank" rel="noreferrer">XAG</a>
          <p className="mx-auto mt-1 max-w-2xl">{pick(audit, "summary", lang)}</p>
        </> : <p>{lang === "ar" ? "أسعار يدوية — لم تُوثّق من المصدر بعد" : "Manual prices — not yet source-verified"}</p>}
      </div>
    </div>
  );
}

export function PriceTable() {
  const { t, lang } = useLang();
  const { data: rows = [] } = useQuery(pricesQuery);
  const last = rows.reduce<string | null>((a, r) => (!a || r.updated_at > a ? r.updated_at : a), null);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-3 bg-secondary px-5 py-3 text-sm font-semibold">
        <span>{t("metalPrices")}</span><span className="text-center text-gold">{t("weSell")}</span><span className="text-center">{t("weBuy")}</span>
      </div>
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-3 border-t border-border px-5 py-3 text-sm">
          <span>{pick(r, "name", lang)}</span>
          <span className="text-center font-semibold text-gold" dir="ltr">{fmt(r.sell, "en")} EGP</span>
          <span className="text-center" dir="ltr">{fmt(r.buy, "en")} EGP</span>
        </div>
      ))}
      {last && <p className="border-t border-border px-5 py-2 text-xs text-muted-foreground">{t("lastUpdate")}: {new Date(last).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { timeZone: "Africa/Cairo" })}</p>}
    </div>
  );
}

export function PriceChart() {
  const { t, lang } = useLang();
  const { data: rows = [] } = useQuery(historyQuery);
  const [range, setRange] = useState(12);
  const [cur, setCur] = useState<"usd" | "egp">("usd");
  const data = useMemo(() => {
    const from = new Date(); from.setMonth(from.getMonth() - range);
    return rows.filter((r) => new Date(r.day) >= from).map((r) => ({ day: r.day, v: Number(r[cur]) }));
  }, [rows, range, cur]);
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg">{t("marketRange")}</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {(["usd", "egp"] as const).map((c) => (
            <button key={c} onClick={() => setCur(c)} className={`rounded px-2.5 py-1 border ${cur === c ? "border-gold text-gold" : "border-border text-muted-foreground"}`}>{c.toUpperCase()}</button>
          ))}
          {[[1, t("month")], [12, t("year")], [36, t("y3")], [60, t("y5")]].map(([m, l]) => (
            <button key={m} onClick={() => setRange(m as number)} className={`rounded px-2.5 py-1 ${range === m ? "bg-gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="h-64" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(d) => String(d).slice(0, 7)} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={["auto", "auto"]} width={60} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} formatter={(v: number) => fmt(v, lang)} />
            <Area type="monotone" dataKey="v" stroke="var(--gold)" fill="url(#g)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ZakatCalculator() {
  const { t, lang } = useLang();
  const { data: rows = [] } = useQuery(pricesQuery);
  const p24 = Number(rows.find((r) => r.name_en.includes("24K"))?.sell ?? 0);
  const [g, setG] = useState("100");
  const [k, setK] = useState("21");
  const r = calcZakat(Number(g) || 0, Number(k), p24);
  return (
    <div className="rounded-xl border border-gold/30 bg-card p-6">
      <h3 className="mb-4 text-2xl text-gold-gradient">{t("zakat")}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">{t("grams")}
          <input type="number" min={0} value={g} onChange={(e) => { setG(e.target.value); if (e.target.value !== "" && Number(e.target.value) >= 0) window.__lovableEvents?.track?.("project.zakat_calculated", { karat: Number(k), above_nisab: calcZakat(Number(e.target.value), Number(k), p24).aboveNisab }); }} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
        </label>
        <label className="text-sm">{t("karat")}
          <select value={k} onChange={(e) => { setK(e.target.value); window.__lovableEvents?.track?.("project.zakat_calculated", { karat: Number(e.target.value), above_nisab: calcZakat(Number(g) || 0, Number(e.target.value), p24).aboveNisab }); }} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2">
            {["24", "22", "21", "18"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-5 rounded-lg bg-secondary p-4 text-center">
        {r.aboveNisab ? (
          <>
            <p className="text-sm text-muted-foreground">{t("zakatDue")}</p>
            <p className="font-display text-3xl font-bold text-gold" dir="ltr">{fmt(r.due, "en")} EGP</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("belowNisab")}</p>
        )}
      </div>
    </div>
  );
}

type ProductRow = { id: string; name_ar: string; name_en: string; description_ar: string | null; description_en: string | null; price: number | null; image_url: string | null };
export function ProductCard({ p, idx }: { p: ProductRow; idx: number }) {
  const { t, lang } = useLang();
  const { data: s } = useQuery(settingsQuery);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        window.__lovableEvents?.track?.("project.product_viewed", { product_id: p.id });
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [p.id]);
  const name = pick(p, "name", lang);
  const msg = lang === "ar" ? `مرحبًا، أريد طلب: ${name}` : `Hello, I'd like to order: ${name}`;
  return (
    <div ref={cardRef} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-gold/60 hover:shadow-gold">
      <Link to="/products/$id" params={{ id: p.id }} className="block aspect-square overflow-hidden bg-secondary">
        <img src={p.image_url || fallbackImages[idx % 4]} alt={name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </Link>
      <div className="p-4">
        <Link to="/products/$id" params={{ id: p.id }} className="hover:text-gold"><h3 className="mb-1 line-clamp-2 min-h-12 text-base">{name}</h3></Link>
        {p.price != null && <p className="mb-3 font-semibold text-gold" dir="ltr">{fmt(p.price, "en")} EGP</p>}
        <a href={whatsappLink(s?.whatsapp_number, msg)} onClick={() => window.__lovableEvents?.track?.("project.whatsapp_clicked", { placement: "product", product_id: p.id })} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-md bg-gold-gradient py-2 text-sm font-semibold text-primary-foreground">
          <MessageCircle className="h-4 w-4" /> {t("buyWhatsapp")}
        </a>
      </div>
    </div>
  );
}

type PostRow = { slug: string; title_ar: string; title_en: string; excerpt_ar: string | null; excerpt_en: string | null; image_url: string | null; created_at: string };
export function PostCard({ p, idx }: { p: PostRow; idx: number }) {
  const { t, lang } = useLang();
  return (
    <Link to="/posts/$slug" params={{ slug: p.slug }} className="group block overflow-hidden rounded-xl border border-border bg-card hover:border-gold/60">
      <div className="aspect-video overflow-hidden">
        <img src={p.image_url || fallbackImages[(idx + 1) % 4]} alt={pick(p, "title", lang)} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-5">
        <p className="mb-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}</p>
        <h3 className="mb-2 text-lg group-hover:text-gold">{pick(p, "title", lang)}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{pick(p, "excerpt", lang)}</p>
        <span className="mt-3 inline-block text-sm text-gold">{t("readMore")} ←</span>
      </div>
    </Link>
  );
}

export function PageHero({ title }: { title: string }) {
  return (
    <section className="relative h-56 overflow-hidden">
      <img src={s1} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-hero-fade" />
      <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-8">
        <h1 className="text-4xl font-bold text-gold-gradient">{title}</h1>
      </div>
    </section>
  );
}

export function ThemeToggle() {
  const { lang } = useLang();
  const [light, setLight] = useState(false);
  useEffect(() => { setLight(document.documentElement.classList.contains("light")); }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try { localStorage.setItem("theme", next ? "light" : "dark"); } catch {}
  };
  const label = light ? (lang === "ar" ? "الوضع الداكن" : "Dark mode") : (lang === "ar" ? "الوضع الساطع" : "Light mode");
  return (
    <button onClick={toggle} aria-label={label} title={label} className="grid h-9 w-9 place-items-center rounded-md border border-border hover:border-gold hover:text-gold">
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
