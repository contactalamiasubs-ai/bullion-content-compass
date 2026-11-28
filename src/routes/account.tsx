import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, LogOut, ShieldCheck, ShoppingBag, Home, Gem, ScanSearch, Info, Phone, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerAvatar } from "@/components/customer-avatar";
import { useState } from "react";
import { toast } from "sonner";
import { LoginPanel } from "@/components/login-panel";
import { useShopping, useShoppingText } from "@/components/shopping-provider";
import { customerAuth as supabase } from "@/lib/customer-client";
import { useLang, pick } from "@/lib/i18n";
import { sectionsQuery } from "@/lib/data";

export const Route = createFileRoute("/account")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "حساب العميل | جولد سنتر" }, { name: "description", content: "دخول العملاء باستخدام جوجل وحفظ السلة والمفضلة في حسابك." },
    { property: "og:title", content: "حساب العميل | جولد سنتر" }, { property: "og:description", content: "حسابك واختياراتك المحفوظة لدى جولد سنتر." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: Account,
});
function Account() {
  const { user, state, authReady, ready, syncError, retry } = useShopping();
  const text = useShoppingText();
  const { lang } = useLang();
  const sections = useQuery(sectionsQuery);
  const profile = useQuery({ queryKey: ["customer-profile", user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return null;
    const result = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (result.error) throw result.error;
    return result.data;
  } });
  const qc = useQueryClient(); const nav = useNavigate();
  if (!user) return <LoginPanel />;
  const t = (key: string, ar: string, en: string) => text(key) || (lang === "ar" ? ar : en);
  const cartCount = Object.values(state.cart).reduce((sum, n) => sum + n, 0);
  const shortcuts = [
    { to: "/", icon: Home, label: t("account_home", "الرئيسية", "Home") },
    { to: "/products", icon: Gem, label: t("account_products", "المنتجات", "Products") },
    { to: "/favorites", icon: Heart, label: `${text("favorites")} (${state.favorites.length})` },
    { to: "/cart", icon: ShoppingBag, label: `${text("cart")} (${cartCount})` },
    { to: "/check-bar", icon: ScanSearch, label: t("account_check", "افحص سبيكتك", "Check your bar") },
    { to: "/news", icon: Newspaper, label: t("account_news", "الأخبار", "News") },
    { to: "/about", icon: Info, label: t("account_about", "من نحن", "About us") },
    { to: "/contact", icon: Phone, label: t("account_contact", "تواصل معنا", "Contact us") },
  ] as const;
  return <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-10 sm:py-14">
    <div className="mb-8 flex items-center justify-between gap-3">
      <Link to="/" aria-label={t("account_home", "الرئيسية", "Home")} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors hover:bg-gold/10"><Home className="size-5" /></Link>
      <h1 className="min-w-0 truncate text-center text-3xl text-gold-gradient sm:text-4xl">{text("account")}</h1>
      <span className="size-11 shrink-0" aria-hidden="true" />
    </div>
    {!authReady ? <p role="status" className="text-center">{text("loading")}</p> : <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-gold/30 bg-card p-6 shadow-[0_20px_60px_-30px_color-mix(in_oklab,var(--gold)_45%,transparent)] sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold to-transparent" />
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-start">
          <CustomerAvatar userId={user.id} name={profile.data?.display_name || user.email || ""} url={profile.data?.avatar_url} size="md" onChanged={() => { void supabase.auth.refreshSession(); void qc.invalidateQueries({ queryKey: ["customer-profile", user.id] }); }} />
          <div className="min-w-0 flex-1">
            <h2 className="break-words text-2xl">{profile.data?.display_name}</h2>
            <p className="break-all text-sm text-muted-foreground" dir="ltr">{user.email}</p>
            {syncError ? <div role="alert" className="mt-3 space-y-2 text-destructive"><p>{text("sync_error")}</p><Button onClick={retry} variant="outline" size="sm">{text("retry")}</Button></div>
              : <p role="status" className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start"><ShieldCheck className="size-4 text-gold" />{text(ready ? "account_saved" : "loading")}</p>}
          </div>
          <Button variant="outline" onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await nav({ to: "/account", replace: true }); }}><LogOut />{text("signout")}</Button>
        </div>
      </section>
      {profile.error && <p role="alert" className="text-destructive">{text("sync_error")}</p>}
      <nav aria-label={t("account_shortcuts", "وصول سريع", "Quick access")}>
        <h2 className="mb-4 text-center text-lg text-gold">{t("account_shortcuts", "وصول سريع", "Quick access")}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {shortcuts.map(({ to, icon: Icon, label }) => <li key={to}>
            <Link to={to} className="group flex h-full min-h-28 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-4 text-center text-sm transition-all hover:-translate-y-0.5 hover:border-gold/60">
              <span className="inline-flex size-12 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold transition-colors group-hover:bg-gold/20"><Icon className="size-5" /></span>
              <span className="break-words">{label}</span>
            </Link>
          </li>)}
        </ul>
      </nav>
      <PasswordChange />
      <p className="whitespace-pre-line text-center text-sm leading-loose text-muted-foreground">{pick(sections.data?.["shopping_customer_notice"], "body", lang)}</p>
    </div>}
  </main>;
}

function PasswordChange() {
  const text = useShoppingText();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return <form className="space-y-3 rounded-2xl border border-border p-4" onSubmit={async (e) => {
    e.preventDefault();
    if (password.length < 8 || password.length > 72) { toast.error(text("auth_weak")); return; }
    setBusy(true);
    const result = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (result.error) { toast.error(text("auth_error")); return; }
    setPassword(""); toast.success(text("welcome_password"));
  }}>
    <label htmlFor="new-password" className="block text-sm text-gold">{text("welcome_password")}</label>
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 min-w-0 rounded-md border border-input bg-background px-3" />
      <Button type="submit" disabled={busy || !password}>{text("welcome_password")}</Button>
    </div>
  </form>;
}
