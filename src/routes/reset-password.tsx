import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoginScene, LoginBrand } from "@/components/login-panel";
import { useShoppingText } from "@/components/shopping-provider";
import { Button } from "@/components/ui/button";
import { authErrorKey } from "@/lib/login";
export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "استعادة كلمة المرور | جولد سنتر" }, { name: "description", content: "تعيين كلمة مرور جديدة لحساب جولد سنتر من رابط الاستعادة." }, { property: "og:title", content: "استعادة كلمة المرور | جولد سنتر" }, { property: "og:description", content: "استعادة الوصول إلى حسابك في جولد سنتر بأمان." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: ResetPassword,
});
function ResetPassword() {
  const text = useShoppingText(); const [ready, setReady] = useState(false); const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    const recoveryHash = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    const pending = sessionStorage.getItem("gold-center-recovery") === "active";
    const check = async (recovery: boolean) => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (recovery && data.user) { sessionStorage.setItem("gold-center-recovery", "active"); setReady(true); }
      setLoading(false);
    };
    const { data } = supabase.auth.onAuthStateChange(event => { if (event === "PASSWORD_RECOVERY") queueMicrotask(() => { void check(true); }); });
    void check(recoveryHash || pending);
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return <LoginScene><section className="login-panel"><LoginBrand /><h1>{text("reset_title")}</h1>
    {loading ? <p role="status">{text("loading")}</p> : done ? <><p role="status" className="login-notice">{text("password_saved")}</p><Button asChild className="login-submit"><Link to="/auth">{text("back_login")}</Link></Button></> : !ready ? <><p role="alert" className="login-error">{text("recovery_invalid")}</p><Button asChild variant="link"><Link to="/auth">{text("back_login")}</Link></Button></> : <form className="login-form" onSubmit={async event => {
      event.preventDefault(); setError("");
      if (password !== confirm) { setError(text("password_mismatch")); return; }
      setBusy(true);
      try {
        const result = await supabase.auth.updateUser({ password });
        if (result.error) { setError(text(authErrorKey(result.error))); return; }
        sessionStorage.removeItem("gold-center-recovery"); setDone(true);
      } catch { setError(text("auth_error")); } finally { setBusy(false); }
    }}>
      <label className="login-field"><input aria-label={text("new_password")} placeholder={text("new_password")} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label className="login-field"><input aria-label={text("confirm_password")} placeholder={text("confirm_password")} type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
      {error && <p role="alert" className="login-error">{error}</p>}
      <Button type="submit" disabled={busy} className="login-submit">{text(busy ? "loading" : "save_password")}</Button>
    </form>}
  </section></LoginScene>;
}
