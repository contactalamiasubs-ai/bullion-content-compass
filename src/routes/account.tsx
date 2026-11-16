import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserRound, Heart, ShoppingBag, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleSignIn } from "@/components/google-sign-in";
import { useShopping, useShoppingText } from "@/components/shopping-provider";
import { supabase } from "@/integrations/supabase/client";
import { useLang, pick } from "@/lib/i18n";
import { sectionsQuery } from "@/lib/data";

export const Route = createFileRoute("/account")({
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
  return <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-12">
    <h1 className="mb-10 text-center text-3xl text-gold">{text(user ? "account" : "customer_login")}</h1>
    {!authReady ? <p role="status">{text("loading")}</p> : !user ? <div className="flex flex-col items-center gap-6 text-center">
      <UserRound className="size-14 text-gold" />
      <p className="max-w-xl whitespace-pre-line text-sm leading-loose text-muted-foreground">{pick(sections.data?.["shopping_customer_notice"], "body", lang)}</p>
      <GoogleSignIn />
    </div> : <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4 border-b border-border pb-6">
        {profile.data?.avatar_url?.startsWith("https://") ? <img referrerPolicy="no-referrer" src={profile.data.avatar_url} alt="" className="size-16 rounded-full object-cover" /> : <UserRound className="size-12 text-gold" />}
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
      <p className="whitespace-pre-line text-sm leading-loose text-muted-foreground">{pick(sections.data?.["shopping_customer_notice"], "body", lang)}</p>
    </div>}
  </main>;
}