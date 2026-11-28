import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CircleCheck, Gem, Heart, PackageSearch, UserCog, LoaderCircle } from "lucide-react";
import goldBarsAsset from "@/assets/auth-gold-bars.webp.asset.json";
import { Button } from "@/components/ui/button";
import { LoginBrand, LoginPanel, LoginScene } from "@/components/login-panel";
import { CustomerAvatar } from "@/components/customer-avatar";
import { useShopping, useShoppingText } from "@/components/shopping-provider";
import { customerAuth } from "@/lib/customer-client";

export const Route = createFileRoute("/welcome")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "مرحبًا بك | جولد سنتر" }, { name: "description", content: "صفحة ترحيب العميل بعد إنشاء الحساب." },
    { property: "og:title", content: "مرحبًا بك | جولد سنتر" }, { property: "og:description", content: "حسابك لدى جولد سنتر جاهز." },
    { name: "robots", content: "noindex" },
  ] }),
  component: Welcome,
});

function Welcome() {
  const { user, authReady } = useShopping();
  const text = useShoppingText();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["customer-profile", user?.id], enabled: !!user, queryFn: async () => {
    const result = await customerAuth.from("profiles").select("*").eq("id", user!.id).single();
    if (result.error) throw result.error;
    return result.data as { display_name: string; email: string; avatar_url: string | null };
  } });
  // The success message is claimed once on the server, so other tabs and later visits skip it.
  const [fresh, setFresh] = useState<boolean | null>(null);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void customerAuth.rpc("claim_welcome").then(({ data, error }) => { if (!cancelled) setFresh(!error && data === true); });
    return () => { cancelled = true; };
  }, [user]);
  if (!authReady) return <LoginScene><LoaderCircle role="status" className="size-10 animate-spin text-gold" /></LoginScene>;
  if (!user) return <LoginPanel />;
  const name = profile.data?.display_name || String(user.user_metadata?.["full_name"] ?? "") || user.email || "";
  const email = profile.data?.email || user.email || "";
  const avatar = profile.data?.avatar_url ?? null;
  const refresh = () => { void customerAuth.auth.refreshSession(); void qc.invalidateQueries({ queryKey: ["customer-profile", user.id] }); };
  const cards = [
    { to: "/products", icon: Gem, title: "welcome_browse", hint: "welcome_browse_hint" },
    { to: "/cart", icon: PackageSearch, title: "welcome_orders", hint: "welcome_orders_hint" },
    { to: "/favorites", icon: Heart, title: "welcome_favorites", hint: "welcome_favorites_hint" },
    { to: "/account", icon: UserCog, title: "welcome_manage", hint: "welcome_manage_hint" },
  ] as const;
  return <LoginScene>
    <img className="auth-bars auth-bars-start" src={goldBarsAsset.url} alt="" width={720} height={720} loading="lazy" decoding="async" />
    <img className="auth-bars auth-bars-end" src={goldBarsAsset.url} alt="" width={720} height={720} loading="lazy" decoding="async" />
    <section className="welcome-panel">
      <LoginBrand />
      <CustomerAvatar userId={user.id} name={name} url={avatar} onChanged={refresh} />
      <h1 className="welcome-name">{name}</h1>
      {fresh ? <div className="welcome-success" role="status">
        <p className="welcome-success-title"><CircleCheck aria-hidden />{text("welcome_success")}</p>
        <p>{text("welcome_body")}</p>
      </div> : <p className="welcome-hello">{text("welcome_hello")}</p>}
      <div className="welcome-card">
        <h2>{text("welcome_card")}</h2>
        <div className="welcome-card-row">
          <CustomerAvatar userId={user.id} name={name} url={avatar} onChanged={refresh} size="md" />
          <dl className="min-w-0">
            <div><dt>{text("welcome_name")}</dt><dd className="break-words">{name}</dd></div>
            <div><dt>{text("welcome_email")}</dt><dd className="break-all" dir="ltr">{email}</dd></div>
          </dl>
        </div>
      </div>
      <nav className="welcome-services">
        {cards.map(({ to, icon: Icon, title, hint }) => <Link key={to} to={to} className="welcome-service"><Icon aria-hidden /><strong>{text(title)}</strong><span>{text(hint)}</span></Link>)}
      </nav>
      <div className="welcome-actions">
        <Button asChild className="welcome-cta"><Link to="/products">{text("welcome_cta")}</Link></Button>
        <Button asChild variant="outline" className="welcome-home"><Link to="/">{text("welcome_home")}</Link></Button>
      </div>
    </section>
  </LoginScene>;
}
