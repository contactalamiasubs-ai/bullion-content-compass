import { SeoImage } from "@/components/seo-image";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNearViewport } from "@/hooks/use-near-viewport";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Menu,
  X,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Heart,
  ShoppingBag,
  House,
  ChartNoAxesCombined,
  Gem,
  BookOpen,
  Newspaper,
  Handshake,
  Info,
  UserRound,
  ScanLine,
} from "lucide-react";
import { useShopping, useShoppingText } from "@/components/shopping-provider";
import { FavoriteButton, AddToCartButton } from "@/components/product-shopping-actions";
import { Button } from "@/components/ui/button";
import { productPrice, type ProductPricing } from "@/lib/product-pricing";
import { ProductAvailability } from "@/components/product-availability";
import { canOrderProduct, productAvailability } from "@/lib/product-availability";
import { useLang, pick } from "@/lib/i18n";
import {
  settingsQuery,
  sectionsQuery,
  slidesQuery,
  pricesQuery,
  verifiedPricesQuery,
  whatsappLink,
  calcZakat,
} from "@/lib/data";
import { staticImages } from "@/lib/static-images";
const s1 = staticImages["slide-1"];
const s2 = staticImages["slide-2"];
const s3 = staticImages["slide-3"];
const s4 = staticImages["slide-4"];

export const fallbackImages = [s1, s2, s3, s4];
const fmt = (n: number, lang: string) =>
  Number(n).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 });

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
  const { data: sections } = useQuery(sectionsQuery);
  const [open, setOpen] = useState(false);
  const { state, user } = useShopping();
  const shoppingText = useShoppingText();
  const cartCount = Object.values(state.cart).reduce((sum, quantity) => sum + quantity, 0);
  const links = [
    { to: "/", l: t("home"), icon: House },
    { to: "/", hash: "prices", l: t("metalPrices"), icon: ChartNoAxesCombined },
    { to: "/products", l: t("products"), icon: Gem },
    { to: "/services", l: t("services"), icon: Handshake },
    { to: "/check-bar", l: pick(sections?.["serial_heading"], "title", lang), icon: ScanLine },
    { to: "/about", l: t("about"), icon: Info },
    { to: "/blog", l: t("blog"), icon: BookOpen },
    { to: "/news", l: t("news"), icon: Newspaper },
    { to: "/contact", l: t("contact"), icon: MessageCircle },
  ] as const;
  const shortcuts = [
    { to: "/account", icon: UserRound, label: shoppingText(user ? "account" : "customer_login"), count: 0 },
    { to: "/favorites", icon: Heart, label: shoppingText("favorites"), count: state.favorites.length },
    { to: "/cart", icon: ShoppingBag, label: shoppingText("cart"), count: cartCount },
  ] as const;
  return (
    <header className="site-header sticky z-40 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="site-header-brand-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2" onClick={() => setOpen(false)}>
            <svg width="0" height="0" aria-hidden="true" className="login-logo-filter"><defs><filter id="header-logo-transparent" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.5 1.5 1.5 1 -1.3" /></filter></defs></svg>
            <span className="brand-mark relative grid h-11 w-11 shrink-0 place-items-center rounded-full sm:h-[52px] sm:w-[52px]">
              {s?.logo_url ? (
                <SeoImage src={s.logo_url} loading="eager" maxWidth={160} sizes="52px" width={52} height={52} alt={pick(s, "site_name", lang)} className="header-brand-logo relative z-10 h-10 w-10 rounded-full object-contain sm:h-12 sm:w-12" />
              ) : (
                <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full bg-gold-gradient font-display text-lg font-bold text-primary-foreground sm:h-12 sm:w-12">Au</span>
              )}
            </span>
            <span className="brand-text flex min-w-0 flex-col">
              <span className="brand-name break-words font-display text-base font-bold sm:text-xl">{pick(s, "site_name", lang)}</span>
              <span aria-hidden className="brand-rule" />
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            <Button variant="outline" onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              aria-label={lang === "ar" ? "English" : "العربية"}
              className="h-11 min-w-11 rounded-full px-2 text-xs hover:border-gold hover:text-gold">
              {lang === "ar" ? "EN" : "عربي"}
            </Button>
          </div>
        </div>
        <nav aria-label={lang === "ar" ? "التنقل الرئيسي" : "Main navigation"}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-border/60 py-2 xl:flex xl:justify-between">
          <div className="hidden min-w-0 items-center gap-1 xl:flex">
            {links.map((x) => (
              <Button asChild variant="ghost" key={x.l} className="site-nav-link">
                <Link to={x.to} hash={"hash" in x ? x.hash : ""} title={x.l}
                  activeProps={{ className: "site-nav-active", "aria-current": "page" }}
                  activeOptions={{ exact: x.to === "/", includeHash: true }}>
                  <span className="nav-icon"><x.icon strokeWidth={1.7} aria-hidden="true" /></span>
                  <span>{x.l}</span>
                </Link>
              </Button>
            ))}
          </div>
          <Button variant="ghost" className="h-12 justify-start gap-2 px-2 text-sm xl:hidden"
            onClick={() => setOpen(!open)} aria-label={lang === "ar" ? "القائمة" : "Menu"}
            aria-expanded={open} aria-controls="mobile-navigation">
            {open ? <X /> : <Menu />} <span>{lang === "ar" ? "القائمة" : "Menu"}</span>
          </Button>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3 xl:border-s xl:border-border xl:ps-4">
            {shortcuts.map((item) => (
              <Button key={item.to} asChild variant="ghost" className="main-nav-shortcut">
                <Link to={item.to} onClick={() => setOpen(false)}
                  aria-label={item.to === "/account" ? item.label : `${item.label} (${item.count})`} title={item.label}
                  activeProps={{ className: "site-nav-active", "aria-current": "page" }}>
                  <span className="relative grid h-8 w-8 shrink-0 place-items-center">
                    <item.icon strokeWidth={1.7} aria-hidden="true" />
                    {item.count > 0 && <span className="shortcut-count" aria-hidden="true">{item.count > 99 ? "99+" : item.count}</span>}
                  </span>
                  <span className="min-w-0 text-center">{item.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </nav>
        {open && (
          <nav id="mobile-navigation" aria-label={lang === "ar" ? "أقسام الموقع" : "Site sections"}
            className="grid max-h-[60dvh] grid-cols-2 gap-2 overflow-y-auto border-t border-border py-3 sm:grid-cols-4 xl:hidden">
            {links.map((x) => (
              <Button key={x.l} asChild variant="ghost" className="mobile-nav-link">
                <Link to={x.to} hash={"hash" in x ? x.hash : ""} onClick={() => setOpen(false)}
                  activeProps={{ className: "site-nav-active", "aria-current": "page" }}
                  activeOptions={{ exact: x.to === "/", includeHash: true }}>
                  <span className="nav-icon"><x.icon strokeWidth={1.7} aria-hidden="true" /></span><span>{x.l}</span>
                </Link>
              </Button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

/** X (formerly Twitter) brand mark — lucide has no X logo. */
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className ?? "h-5 w-5"}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

/** Verified business location (from the company's Google Maps listing). */
const BUSINESS_LOCATION = {
  lat: 30.1025034,
  lng: 31.348448,
  placeId: "ChIJty-SWG4VWBQRuWOdrOZ0l6Q",
} as const;

const locationUrl = `https://www.google.com/maps/search/?api=1&query=${BUSINESS_LOCATION.lat},${BUSINESS_LOCATION.lng}&query_place_id=${BUSINESS_LOCATION.placeId}`;

/** tel: target from a dashboard-entered number: keeps + and digits, drops spaces, dashes and slashes. */
export function phoneHref(value: string): string {
  const trimmed = value.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return `${plus}${trimmed.replace(/\D/g, "")}`;
}

export function Footer() {
  const { t, lang } = useLang();
  const { data: s } = useQuery(settingsQuery);
  const { data: sections } = useQuery(sectionsQuery);
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="mb-3 text-2xl text-gold-gradient">{pick(s, "site_name", lang)}</h3>
          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold"
          >
            <MapPin className="h-4 w-4 shrink-0 text-gold" /> {pick(s, "address", lang)}
          </a>
          <div className="mt-4 flex gap-3">
            {s?.facebook && (
              <a
                href={s.facebook}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-gold"
              >
                <Facebook />
              </a>
            )}
            {s?.instagram && (
              <a
                href={s.instagram}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-gold"
              >
                <Instagram />
              </a>
            )}
            {s?.x_url && (
              <a
                href={s.x_url}
                target="_blank"
                rel="noreferrer"
                aria-label={lang === "ar" ? "إكس" : "X"}
                className="text-muted-foreground hover:text-gold"
              >
                <XLogo />
              </a>
            )}
            {s?.youtube && (
              <a
                href={s.youtube}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-gold"
              >
                <Youtube />
              </a>
            )}
          </div>
        </div>
        <nav aria-label={lang === "ar" ? "روابط أسفل الصفحة" : "Footer navigation"} className="grid grid-cols-2 content-start gap-x-3 gap-y-2 text-sm">
          {([
            { to: "/about", label: t("about"), icon: Info },
            { to: "/services", label: t("services"), icon: Handshake },
            { to: "/products", label: t("products"), icon: Gem },
            { to: "/blog", label: t("blog"), icon: BookOpen },
            { to: "/news", label: t("news"), icon: Newspaper },
            { to: "/contact", label: t("contact"), icon: MessageCircle },
          ] as const).map((item) => (
            <Button key={item.to} asChild variant="ghost" className="h-auto min-h-12 min-w-0 justify-start gap-2 rounded-md px-1.5 py-2 text-muted-foreground hover:text-gold">
              <Link to={item.to}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-secondary text-gold">
                  <item.icon aria-hidden="true" strokeWidth={1.7} />
                </span>
                <span className="min-w-0 whitespace-normal break-words text-start">{item.label}</span>
              </Link>
            </Button>
          ))}
        </nav>
        <div className="space-y-2 text-sm text-muted-foreground">
          {s?.phone && (
            <a
              href={`tel:${phoneHref(s.phone)}`}
              className="flex items-center gap-2 hover:text-gold"
            >
              <Phone className="h-4 w-4 shrink-0 text-gold" /> <span dir="ltr">{s.phone}</span>
            </a>
          )}
          {s?.email && (
            <a
              href={`mailto:${s.email.trim()}`}
              className="flex items-center gap-2 hover:text-gold"
            >
              <Mail className="h-4 w-4 shrink-0 text-gold" /> <span className="break-all">{s.email}</span>
            </a>
          )}
          <a
            href={locationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-gold"
          >
            <MapPin className="h-4 w-4 shrink-0 text-gold" /> {pick(s, "address", lang)}
          </a>
          {(s?.service_whatsapp || s?.service_phone) && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="font-medium text-gold">
                {pick(sections?.["customer_service"], "title", lang)}
              </p>
              {s?.service_whatsapp && (
                <a
                  href={whatsappLink(s.service_whatsapp, "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-gold"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-gold" />{" "}
                  <span dir="ltr">{`+${s.service_whatsapp}`}</span>
                </a>
              )}
              {s?.service_phone && (
                <a
                  href={`tel:${phoneHref(s.service_phone)}`}
                  className="flex items-center gap-2 hover:text-gold"
                >
                  <Phone className="h-4 w-4 shrink-0 text-gold" />{" "}
                  <span dir="ltr">{s.service_phone}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {pick(s, "site_name", lang)} — {t("rights")}
      </p>
      {s?.whatsapp_number && (
        <a
          href={whatsappLink(s.whatsapp_number, "")}
          onClick={() => {
            try {
              window.__lovableEvents?.track?.("project.whatsapp_clicked", {
                placement: "floating",
              });
            } catch {
              /* analytics is optional */
            }
          }}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="fixed bottom-5 end-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-success text-primary-foreground shadow-gold"
        >
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
  const close = () => {
    sessionStorage.setItem("popup_seen", "1");
    setOpen(false);
  };
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md rounded-xl border border-gold/40 bg-card p-8 text-center shadow-gold"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute end-3 top-3 text-muted-foreground hover:text-gold"
          aria-label={t("close")}
        >
          <X />
        </button>
        <h3 className="mb-6 text-2xl text-gold-gradient">{pick(s, "popup_title", lang)}</h3>
        <a
          href={s.popup_link ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-md bg-gold-gradient px-6 py-2.5 font-semibold text-primary-foreground"
        >
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
  const [loadedSlides, setLoadedSlides] = useState([0]);
  useEffect(() => {
    if (!active.length) return;
    setLoadedSlides(previous => previous.includes(i % active.length) ? previous : [...previous, i % active.length]);
    const warm = setTimeout(() => setLoadedSlides(previous => {
      const next = (i + 1) % active.length;
      return previous.includes(next) ? previous : [...previous, next];
    }), 3000);
    return () => clearTimeout(warm);
  }, [i, active.length]);
  useEffect(() => {
    if (active.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => { if (!document.hidden) setI((p) => (p + 1) % active.length); }, 6000);
    return () => clearInterval(id);
  }, [active.length]);
  if (!active.length) return <div className="h-[70vh] bg-card" />;
  const cur = active[i % active.length];
  if (!cur) return null;
  const go = (d: number) => setI((p) => (p + d + active.length) % active.length);
  return (
    <section className="relative h-[62svh] min-h-[420px] max-h-[640px] overflow-hidden sm:h-[70vh] md:h-[75vh] md:min-h-[480px] md:max-h-none">
      {active.map((sl, idx) => loadedSlides.includes(idx) ? (
        <SeoImage
          key={sl.id}
          src={sl.image_url || fallbackImages[idx % 4]}
          alt={pick(sl, "title", lang)}
          width={1920}
          height={912}
          sizes="(max-width: 767px) 180vw, 100vw"
          loading="eager"
          fetchPriority={idx === 0 ? "high" : "low"}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${idx === i % active.length ? "opacity-100" : "opacity-0"}`}
        />
      ) : null)}
      <div className="absolute inset-0 bg-hero-fade" />
      <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-24 md:pb-28">
        <div
          key={cur.id}
          className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <h1 className="mb-3 line-clamp-3 text-2xl font-bold leading-snug sm:text-4xl md:mb-4 md:text-6xl md:leading-tight text-gold-gradient">
            {pick(cur, "title", lang)}
          </h1>
          <p className="mb-5 line-clamp-3 text-sm text-foreground/85 sm:text-base md:mb-6 md:text-lg">{pick(cur, "body", lang)}</p>
          {pick(cur, "button", lang) && (
            <a
              href={cur.link ?? "#"}
              className="inline-block rounded-md bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold md:px-7 md:py-3 md:text-base"
            >
              {pick(cur, "button", lang)}
            </a>
          )}
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 md:bottom-14 flex -translate-x-1/2 items-center gap-3">
        <button
          onClick={() => go(-1)}
          className="rounded-full border border-border p-1.5 hover:border-gold"
          aria-label="prev"
        >
          <ChevronRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
        </button>
        {active.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all ${idx === i % active.length ? "w-8 bg-gold" : "w-3 bg-muted-foreground/50"}`}
          />
        ))}
        <button
          onClick={() => go(1)}
          className="rounded-full border border-border p-1.5 hover:border-gold"
          aria-label="next"
        >
          <ChevronLeft className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" />
        </button>
      </div>
    </section>
  );
}

export function PriceTicker() {
  const { t, lang } = useLang();
  const { data: s } = useQuery(settingsQuery);
  const { data: audits = [] } = useQuery(verifiedPricesQuery);
  const audit = audits[0];
  const verified =
    audit &&
    Number(audit.gold_usd) === Number(s?.gold_usd) &&
    Number(audit.silver_usd) === Number(s?.silver_usd);
  if (!s) return null;
  return (
    <div className="mx-auto -mt-10 grid max-w-4xl grid-cols-2 gap-4 px-4 relative z-10">
      {[
        { l: t("goldPrice"), v: s.gold_usd },
        { l: t("silverPrice"), v: s.silver_usd },
      ].map((x) => (
        <div
          key={x.l}
          className="rounded-xl border border-gold/30 bg-card p-5 text-center shadow-gold"
        >
          <p className="text-sm text-muted-foreground">{x.l}</p>
          <p className="my-1 font-display text-3xl font-bold text-gold-gradient" dir="ltr">
            {fmt(x.v, "en")} USD
          </p>
          <p className="text-xs text-muted-foreground">{t("perOz")}</p>
        </div>
      ))}
      <div className="col-span-2 text-center text-xs text-muted-foreground">
        {verified ? (
          <>
            <p>
              {t("lastUpdate")}:{" "}
              {new Date(audit.verified_at).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
                timeZone: "Africa/Cairo",
              })}
            </p>
            <a
              className="text-gold underline"
              href={audit.gold_source_url}
              target="_blank"
              rel="noreferrer"
            >
              Gold API · XAU
            </a>
            {" · "}
            <a
              className="text-gold underline"
              href={audit.silver_source_url}
              target="_blank"
              rel="noreferrer"
            >
              XAG
            </a>
            <p className="mx-auto mt-1 max-w-2xl">{pick(audit, "summary", lang)}</p>
          </>
        ) : (
          <p>
            {lang === "ar"
              ? "أسعار يدوية — لم تُوثّق من المصدر بعد"
              : "Manual prices — not yet source-verified"}
          </p>
        )}
      </div>
    </div>
  );
}

export function PriceTable() {
  const { t, lang } = useLang();
  const { data: rows = [] } = useQuery(pricesQuery);
  const last = rows.reduce<string | null>(
    (a, r) => (!a || r.updated_at > a ? r.updated_at : a),
    null,
  );
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-3 bg-secondary px-5 py-3 text-sm font-semibold">
        <span>{t("metalPrices")}</span>
        <span className="text-center text-gold">{t("weSell")}</span>
        <span className="text-center">{t("weBuy")}</span>
      </div>
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-3 border-t border-border px-5 py-3 text-sm">
          <span>{pick(r, "name", lang)}</span>
          <span className="text-center font-semibold text-gold" dir="ltr">
            {fmt(r.sell, "en")} EGP
          </span>
          <span className="text-center" dir="ltr">
            {fmt(r.buy, "en")} EGP
          </span>
        </div>
      ))}
      {last && (
        <p className="border-t border-border px-5 py-2 text-xs text-muted-foreground">
          {t("lastUpdate")}:{" "}
          {new Date(last).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
            timeZone: "Africa/Cairo",
          })}
        </p>
      )}
      <div className="border-t border-border p-3">
        <Button asChild variant="outline" className="w-full whitespace-normal text-gold">
          <Link to="/products"><Gem aria-hidden="true" />{t("products")}<ChevronLeft className="ltr:rotate-180" aria-hidden="true" /></Link>
        </Button>
      </div>
    </div>
  );
}

const LazyPriceChart = lazy(() => import("@/components/price-chart"));
export function PriceChart() {
  const { ref, near } = useNearViewport<HTMLDivElement>();
  const placeholder = <div className="h-[344px] rounded-xl border border-border bg-card" />;
  return <div ref={ref}>{near ? <Suspense fallback={placeholder}><LazyPriceChart /></Suspense> : placeholder}</div>;
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
        <label className="text-sm">
          {t("grams")}
          <input
            type="number"
            min={0}
            value={g}
            onChange={(e) => {
              setG(e.target.value);
              if (e.target.value !== "" && Number(e.target.value) >= 0)
                window.__lovableEvents?.track?.("project.zakat_calculated", {
                  karat: Number(k),
                  above_nisab: calcZakat(Number(e.target.value), Number(k), p24).aboveNisab,
                });
            }}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
          />
        </label>
        <label className="text-sm">
          {t("karat")}
          <select
            value={k}
            onChange={(e) => {
              setK(e.target.value);
              window.__lovableEvents?.track?.("project.zakat_calculated", {
                karat: Number(e.target.value),
                above_nisab: calcZakat(Number(g) || 0, Number(e.target.value), p24).aboveNisab,
              });
            }}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
          >
            {["24", "22", "21", "18"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 rounded-lg bg-secondary p-4 text-center">
        {r.aboveNisab ? (
          <>
            <p className="text-sm text-muted-foreground">{t("zakatDue")}</p>
            <p className="font-display text-3xl font-bold text-gold" dir="ltr">
              {fmt(r.due, "en")} EGP
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{t("belowNisab")}</p>
        )}
      </div>
    </div>
  );
}

type ProductRow = ProductPricing & {
  availability?: string | null;
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number | null;
  image_url: string | null;
};
export function ProductCard({ p, idx }: { p: ProductRow; idx: number }) {
  const { t, lang } = useLang();
  const { view, ready } = useShopping();
  const shoppingText = useShoppingText();
  const { data: s } = useQuery(settingsQuery);
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          view(p.id);
          try { window.__lovableEvents?.track?.("project.product_viewed", { product_id: p.id }); } catch { /* Optional analytics. */ }
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [p.id, view, ready]);
  const name = pick(p, "name", lang);
  const price = productPrice(p, s);
  const available = canOrderProduct(p);
  const reservation = productAvailability(p.availability) === "reservation";
  const msg = lang === "ar"
    ? `مرحبًا، أريد ${available ? "طلب" : reservation ? "حجز" : "الاستفسار عن"}: ${name}`
    : `Hello, I'd like to ${available ? "order" : reservation ? "reserve" : "inquire about"}: ${name}`;
  return (
    <div
      ref={cardRef}
      className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-gold/60 hover:shadow-gold"
    >
      <div className="relative">
      <div className="absolute end-2 top-2 z-10"><FavoriteButton id={p.id} /></div>
      <Link
        to="/products/$id"
        params={{ id: p.id }}
        className="block aspect-square overflow-hidden bg-secondary"
      >
        <SeoImage
          src={p.image_url || fallbackImages[idx % 4]}
          alt={name}
          width={600}
          height={600}
          maxWidth={640}
          sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 300px"
          loading="lazy"
          className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
        />
      </Link>
      </div>
      <div className="p-4">
        <ProductAvailability value={p.availability} />
        <Link to="/products/$id" params={{ id: p.id }} className="hover:text-gold">
          <h3 className="mb-1 line-clamp-2 min-h-12 text-base">{name}</h3>
        </Link>
        {price != null && (
          <p className="mb-3 font-semibold text-gold" dir="ltr">
            {fmt(price, "en")} EGP
          </p>
        )}
        {available && <div className="mb-2"><AddToCartButton id={p.id} /></div>}
        <Button
          asChild
          className="flex h-auto w-full items-center justify-center gap-2 bg-gold-gradient py-2 text-sm font-semibold text-primary-foreground"
        >
          <a
            href={whatsappLink(s?.whatsapp_number, msg)}
            onClick={() => {
              try {
                window.__lovableEvents?.track?.("project.whatsapp_clicked", {
                  placement: "product",
                  product_id: p.id,
                });
              } catch {
                /* analytics is optional */
              }
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="h-4 w-4" /> {available ? t("buyWhatsapp") : shoppingText(reservation ? "reserve_product" : "inquire_product")}
          </a>
        </Button>
      </div>
    </div>
  );
}

type PostRow = {
  slug: string;
  title_ar: string;
  title_en: string;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  image_url: string | null;
  created_at: string;
};
export function PostCard({ p, idx }: { p: PostRow; idx: number }) {
  const { t, lang } = useLang();
  return (
    <Link
      to="/posts/$slug"
      params={{ slug: p.slug }}
      className="group block overflow-hidden rounded-xl border border-border bg-card hover:border-gold/60"
    >
      <div className="aspect-video overflow-hidden">
        <SeoImage
          src={p.image_url || fallbackImages[(idx + 1) % 4]}
          alt={pick(p, "title", lang)}
          width={800}
          height={450}
          loading="lazy"
          className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <p className="mb-2 text-xs text-muted-foreground">
          {new Date(p.created_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB")}
        </p>
        <h3 className="mb-2 text-lg group-hover:text-gold">{pick(p, "title", lang)}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{pick(p, "excerpt", lang)}</p>
        <span className="mt-3 inline-block text-sm text-gold">{t("readMore")} ←</span>
      </div>
    </Link>
  );
}

export function PageHero({ title, centered = false }: { title: string; centered?: boolean }) {
  return (
    <section className="relative h-56 overflow-hidden">
      <SeoImage src={s1} alt="" aria-hidden="true" width={1920} height={600} loading="eager" fetchPriority="high" sizes="100vw" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-hero-fade" />
      <div className={`relative mx-auto flex h-full max-w-7xl px-4 ${centered ? "items-center justify-center text-center" : "items-end pb-8"}`}>
        <h1 className="text-4xl font-bold text-gold-gradient">{title}</h1>
      </div>
    </section>
  );
}

export function ThemeToggle() {
  const { lang } = useLang();
  const [light, setLight] = useState(false);
  useEffect(() => {
    setLight(document.documentElement.classList.contains("light"));
  }, []);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem("theme", next ? "light" : "dark");
    } catch {
      /* analytics is optional */
    }
  };
  const label = light
    ? lang === "ar"
      ? "الوضع الداكن"
      : "Dark mode"
    : lang === "ar"
      ? "الوضع الساطع"
      : "Light mode";
  return (
    <Button variant="outline" size="icon"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="site-tool"
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
