import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, LogOut, ShieldCheck, ShoppingBag } from "lucide-react";
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
  return <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-12">
    <h1 className="mb-10 text-center text-3xl text-gold-gradient sm:text-4xl">{text(user ? "account" : "customer_login")}</h1>
    {!authReady ? <p role="status" className="text-center">{text("loading")}</p> : <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4 border-b border-border pb-6">
        <CustomerAvatar userId={user.id} name={profile.data?.display_name || user.email || ""} url={profile.data?.avatar_url} size="md" onChanged={() => { void supabase.auth.refreshSession(); void qc.invalidateQueries({ queryKey: ["customer-profile", user.id] }); }} />
        <div className="min-w-0 flex-1"><h2 className="break-words text-xl">{profile.data?.display_name}</h2><p className="break-all text-sm text-muted-foreground" dir="ltr">{user.email}</p></div>
        <Button variant="outline" onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); await nav({ to: "/account", replace: true }); }}><LogOut />{text("signout")}</Button>
      </div>
      {syncError ? <div role="alert" className="space-y-3 text-destructive"><p>{text("sync_error")}</p><Button onClick={retry} variant="outline">{text("retry")}</Button></div>
        : <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="text-gold" />{text(ready ? "account_saved" : "loading")}</p>}
      {profile.error && <p role="alert" className="text-destructive">{text("sync_error")}</p>}
      <div className="grid grid-cols-2 gap-4">
        <Button asChild variant="outline" className="h-auto min-h-24 flex-col gap-3 whitespace-normal"><Link to="/favorites"><Heart className="text-gold" />{text("favorites")} ({state.favorites.length})</Link></Button>
        <Button asChild variant="outline" className="h-auto min-h-24 flex-col gap-3 whitespace-normal"><Link to="/cart"><ShoppingBag className="text-gold" />{text("cart")} ({Object.values(state.cart).reduce((sum, n) => sum + n, 0)})</Link></Button>
      </div>
      <PasswordChange />
      <p className="whitespace-pre-line text-sm leading-loose text-muted-foreground">{pick(sections.data?.["shopping_customer_notice"], "body", lang)}</p>
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
