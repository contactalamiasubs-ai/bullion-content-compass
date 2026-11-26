import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, LockKeyhole, Eye, EyeOff, LogIn, LoaderCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleSignIn } from "@/components/google-sign-in";
import { useShoppingText } from "@/components/shopping-provider";
import { settingsQuery } from "@/lib/data";
import { pick, useLang } from "@/lib/i18n";
import { authErrorKey, rememberLogin, type LoginDestination } from "@/lib/login";
import marketImage from "@/assets/login-gold-market.jpg";

export function LoginScene({ children }: { children: React.ReactNode }) {
  const { data } = useQuery(settingsQuery);
  const bg = (data as { login_background_url?: string | null } | undefined)?.login_background_url || marketImage;
  return <main className="login-scene"><img className="login-market" src={bg} alt="" width={1536} height={1024} fetchPriority="high" /><div className="login-scene-content">{children}</div></main>;
}
export function LoginBrand() {
  const { data } = useQuery(settingsQuery);
  const { lang } = useLang();
  const d = data as { login_logo_url?: string | null; logo_url?: string | null } | undefined;
  const logo = d?.login_logo_url || d?.logo_url;
  return <div className="login-brand"><svg width="0" height="0" aria-hidden="true" className="login-logo-filter"><defs><filter id="login-logo-transparent" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.5 1.5 1.5 1 -1.3" /></filter></defs></svg>{logo ? <img className="login-brand-logo" src={logo} alt={pick(data, "site_name", lang)} width={128} height={72} /> : null}<div className="login-brand-english" dir="ltr">{pick(data, "site_name", "en")}</div><div className="login-brand-arabic" dir="rtl"><span />{pick(data, "site_name", lang)}<span /></div></div>;
}
export function LoginPanel({ destination = "/account" }: { destination?: LoginDestination }) {
  const text = useShoppingText();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const switchMode = (next: typeof mode) => { setMode(next); setError(""); setNotice(""); setPassword(""); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      if (mode === "forgot") {
        const result = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) { setError(text(authErrorKey(result.error))); return; }
        setNotice(text("reset_sent")); return;
      }
      rememberLogin(remember);
      if (mode === "up") {
        const result = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
        if (result.error) { setError(text(authErrorKey(result.error))); return; }
        if (!result.data.session) { setNotice(text("confirm_email")); return; }
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) { setError(text(authErrorKey(result.error))); return; }
      }
      const verified = await supabase.auth.getUser();
      if (verified.error || !verified.data.user) { setError(text("auth_error")); return; }
      toast.success(text("auth_success")); await nav({ to: destination, replace: true });
    } catch { setError(text("auth_error")); } finally { setBusy(false); }
  };
  return <LoginScene><section className="login-panel"><LoginBrand />
    <h1>{text(mode === "forgot" ? "reset_title" : mode === "up" ? "signup" : "login")}</h1>
    <p className="login-welcome">{text(destination === "/admin" ? "admin_welcome" : "welcome")}</p>
    <form onSubmit={submit} className="login-form">
      <label className="login-field"><Mail aria-hidden="true" /><input aria-label={text("email")} placeholder={text("email")} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></label>
      {mode !== "forgot" && <label className="login-field"><LockKeyhole aria-hidden="true" /><input aria-label={text("password")} placeholder={text("password")} type={show ? "text" : "password"} autoComplete={mode === "up" ? "new-password" : "current-password"} minLength={mode === "up" ? 8 : undefined} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /><Button variant="ghost" size="icon" type="button" aria-label={text(show ? "hide_password" : "show_password")} title={text(show ? "hide_password" : "show_password")} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</Button></label>}
      {mode === "in" && <div className="login-options"><label htmlFor={`remember-${destination}`}><Checkbox id={`remember-${destination}`} checked={remember} onCheckedChange={v => setRemember(v === true)} />{text("remember")}</label><Button variant="link" type="button" onClick={() => switchMode("forgot")}>{text("forgot")}</Button></div>}
      {error && <p role="alert" className="login-error">{error}</p>}{notice && <p role="status" className="login-notice">{notice}</p>}
      <Button type="submit" className="login-submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <LogIn />}{text(busy ? "loading" : mode === "forgot" ? "reset_send" : mode === "up" ? "signup" : "submit")}</Button>
    </form>
    {mode !== "forgot" && <><div className="login-divider"><span />{text("or")}<span /></div><GoogleSignIn destination={destination} remember={remember} /></>}
    <div className="login-bottom">{mode === "forgot" ? <Button variant="link" onClick={() => switchMode("in")}>{text("back_login")}</Button> : <><span>{text(mode === "in" ? "no_account" : "have_account")}</span><Button variant="link" onClick={() => switchMode(mode === "in" ? "up" : "in")}>{text(mode === "in" ? "signup" : "login")}</Button></>}</div>
    <Button asChild variant="ghost" className="login-home"><Link to="/"><ArrowRight />{text("home_link")}</Link></Button>
  </section></LoginScene>;
}