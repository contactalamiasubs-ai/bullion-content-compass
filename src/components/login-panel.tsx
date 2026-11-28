import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, LockKeyhole, Eye, EyeOff, LogIn, LoaderCircle, ArrowRight, UserRound, UserPlus, Phone, MailCheck, Send } from "lucide-react";
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import goldBarsAsset from "@/assets/auth-gold-bars.webp.asset.json";
import { toast } from "sonner";
import { customerAuth as supabase } from "@/lib/customer-client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useShoppingText } from "@/components/shopping-provider";
import { settingsQuery } from "@/lib/data";
import { pick, useLang } from "@/lib/i18n";
import { authErrorKey, rememberLogin, type LoginDestination } from "@/lib/login";
import { staticImages } from "@/lib/static-images";
import { SeoImage } from "@/components/seo-image";

export function LoginScene({ children }: { children: React.ReactNode }) {
  const { data } = useQuery(settingsQuery);
  const bg = (data as { login_background_url?: string | null } | undefined)?.login_background_url || staticImages["login-gold-market"];
  return <main className="login-scene"><SeoImage className="login-market" src={bg} alt="" width={1536} height={1024} loading="eager" fetchPriority="high" sizes="(max-width: 767px) 150vw, 100vw" /><div className="login-scene-content">{children}</div></main>;
}
export function LoginBrand() {
  const { data } = useQuery(settingsQuery);
  const { lang } = useLang();
  const d = data as { login_logo_url?: string | null; logo_url?: string | null } | undefined;
  const logo = d?.login_logo_url || d?.logo_url;
  return <div className="login-brand"><svg width="0" height="0" aria-hidden="true" className="login-logo-filter"><defs><filter id="login-logo-transparent" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1.5 1.5 1.5 1 -1.3" /></filter></defs></svg>{logo ? <SeoImage className="login-brand-logo" src={logo} alt={pick(data, "site_name", lang)} width={240} height={150} loading="eager" sizes="240px" maxWidth={960} /> : <><div className="login-brand-english" dir="ltr">{pick(data, "site_name", "en")}</div><div className="login-brand-arabic" dir="rtl"><span />{pick(data, "site_name", lang)}<span /></div></>}</div>;
}
const goldBars = new URL(goldBarsAsset.url, "https://bullion-content-compass.lovable.app").href;
export function AuthShell({ title, welcome, tab, children }: { title: string; welcome: string; tab?: "in" | "up"; children: React.ReactNode }) {
  const text = useShoppingText();
  return <LoginScene><img className="auth-bars auth-bars-start" src={goldBars} alt="" width={720} height={720} loading="lazy" decoding="async" /><img className="auth-bars auth-bars-end" src={goldBars} alt="" width={720} height={720} loading="lazy" decoding="async" />
    <section className="login-panel"><LoginBrand />
    <h1 className="auth-title"><span />{title}<span /></h1>
    <p className="login-welcome">{welcome}</p>
    {tab && <nav className="auth-tabs" aria-label={text("login")}><Link to="/login" data-active={tab === "in"}><UserRound />{text("login")}</Link><Link to="/register" data-active={tab === "up"}><UserPlus />{text("signup")}</Link></nav>}
    {children}
    <Button asChild variant="ghost" className="login-home"><Link to="/"><ArrowRight />{text("home_link")}</Link></Button>
  </section></LoginScene>;
}
function PasswordField({ value, onChange, placeholder, auto, disabled }: { value: string; onChange: (v: string) => void; placeholder: string; auto: string; disabled: boolean }) {
  const text = useShoppingText(); const [show, setShow] = useState(false);
  return <label className="login-field"><LockKeyhole aria-hidden="true" /><input aria-label={placeholder} placeholder={placeholder} type={show ? "text" : "password"} autoComplete={auto} required value={value} onChange={e => onChange(e.target.value)} disabled={disabled} /><Button variant="ghost" size="icon" type="button" aria-label={text(show ? "hide_password" : "show_password")} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</Button></label>;
}
export function passwordStrength(p: string): 0 | 1 | 2 | 3 {
  if (!p) return 0;
  let s = 0; if (p.length >= 8) s++; if (p.length >= 12) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return p.length < 8 || s <= 2 ? 1 : s <= 3 ? 2 : 3;
}
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export function LoginPanel({ destination = "/account" }: { destination?: LoginDestination }) {
  const text = useShoppingText(); const nav = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return; setError("");
    if (!emailOk(email)) { setError(text("email_invalid")); return; }
    setBusy(true);
    try {
      rememberLogin(remember);
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) { if (result.error.code === "email_not_confirmed") { await nav({ to: "/verify-email", search: { email: email.trim() } }); return; } setError(text(authErrorKey(result.error))); return; }
      const verified = await supabase.auth.getUser();
      if (verified.error || !verified.data.user) { setError(text("auth_error")); return; }
      toast.success(text("auth_success")); await nav({ to: destination, replace: true });
    } catch { setError(text("auth_error")); } finally { setBusy(false); }
  };
  return <AuthShell title={text("login_title")} welcome={text("login_welcome")} tab="in">
    <form onSubmit={submit} className="login-form" noValidate>
      <label className="login-field"><Mail aria-hidden="true" /><input aria-label={text("email")} placeholder={text("email")} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></label>
      <PasswordField value={password} onChange={setPassword} placeholder={text("password")} auto="current-password" disabled={busy} />
      <div className="login-options"><label htmlFor="remember-login"><Checkbox id="remember-login" checked={remember} onCheckedChange={v => setRemember(v === true)} />{text("remember")}</label><Link to="/forgot-password" className="auth-link">{text("forgot")}</Link></div>
      {error && <p role="alert" className="login-error">{error}</p>}
      <Button type="submit" className="login-submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <LogIn />}{text("login")}</Button>
    </form>
    <div className="login-bottom"><span>{text("no_account")}</span><Link to="/register" className="auth-link">{text("signup")}</Link></div>
  </AuthShell>;
}

const countries = getCountries().map(c => ({ c, code: getCountryCallingCode(c) })).sort((a, b) => Number(a.code) - Number(b.code));
export function RegisterPanel() {
  const text = useShoppingText(); const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", country: "EG" as CountryCode, phone: "", password: "", confirm: "" });
  const [terms, setTerms] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));
  const strength = passwordStrength(f.password);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return; setError("");
    const phone = parsePhoneNumberFromString(f.phone, f.country);
    if (f.name.trim().length < 3 || f.name.length > 100) return setError(text("name_invalid"));
    if (!emailOk(f.email)) return setError(text("email_invalid"));
    if (!phone?.isValid()) return setError(text("phone_invalid"));
    if (f.password.length < 8 || f.password.length > 72) return setError(text("auth_weak"));
    if (f.password !== f.confirm) return setError(text("password_mismatch"));
    if (!terms) return setError(text("terms_required"));
    setBusy(true);
    try {
      rememberLogin(true);
      const email = f.email.trim();
      const result = await supabase.auth.signUp({ email, password: f.password, options: { emailRedirectTo: window.location.origin, data: { full_name: f.name.trim(), phone: phone.number } } });
      if (result.error) { setError(text(authErrorKey(result.error))); return; }
      if (!result.data.session) { await nav({ to: "/verify-email", search: { email } }); return; }
      toast.success(text("auth_success")); await nav({ to: "/account", replace: true });
    } catch { setError(text("auth_error")); } finally { setBusy(false); }
  };
  const labels = ["", text("strength_weak"), text("strength_medium"), text("strength_strong")];
  return <AuthShell title={text("register_title")} welcome={text("register_welcome")} tab="up">
    <form onSubmit={submit} className="login-form" noValidate>
      <label className="login-field"><UserRound aria-hidden="true" /><input aria-label={text("full_name")} placeholder={text("full_name")} autoComplete="name" maxLength={100} required value={f.name} onChange={e => set("name")(e.target.value)} disabled={busy} /></label>
      <label className="login-field"><Mail aria-hidden="true" /><input aria-label={text("email")} placeholder={text("email")} type="email" autoComplete="email" maxLength={255} required value={f.email} onChange={e => set("email")(e.target.value)} disabled={busy} /></label>
      <div className="auth-phone" dir="ltr"><select aria-label={text("country_code")} value={f.country} onChange={e => set("country")(e.target.value)} disabled={busy}>{countries.map(({ c, code }) => <option key={c} value={c}>{c} +{code}</option>)}</select>
        <label className="login-field"><Phone aria-hidden="true" /><input aria-label={text("phone")} placeholder={text("phone")} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={20} required value={f.phone} onChange={e => set("phone")(e.target.value)} disabled={busy} /></label></div>
      <PasswordField value={f.password} onChange={set("password")} placeholder={text("password")} auto="new-password" disabled={busy} />
      {strength > 0 && <div className="auth-strength" data-level={strength}><div><span /><span /><span /></div><p>{labels[strength]}</p></div>}
      <PasswordField value={f.confirm} onChange={set("confirm")} placeholder={text("confirm_password")} auto="new-password" disabled={busy} />
      <div className="login-options"><label htmlFor="terms"><Checkbox id="terms" checked={terms} onCheckedChange={v => setTerms(v === true)} />{text("terms_agree")}</label></div>
      {error && <p role="alert" className="login-error">{error}</p>}
      <Button type="submit" className="login-submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <UserPlus />}{text("signup")}</Button>
    </form>
    <div className="login-bottom"><span>{text("have_account")}</span><Link to="/login" className="auth-link">{text("login")}</Link></div>
  </AuthShell>;
}

export function VerifyEmailPanel({ email }: { email: string }) {
  const text = useShoppingText(); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const [error, setError] = useState("");
  const resend = async () => {
    if (busy || !emailOk(email)) return; setBusy(true); setMsg(""); setError("");
    try { const r = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: window.location.origin } }); if (r.error) setError(text(authErrorKey(r.error))); else setMsg(text("verify_resent")); }
    catch { setError(text("auth_error")); } finally { setBusy(false); }
  };
  return <AuthShell title={text("verify_title")} welcome={text("verify_body")}>
    <div className="login-form"><div className="auth-verify-icon"><MailCheck /></div>
      {email && <p className="auth-email" dir="ltr">{email}</p>}
      {error && <p role="alert" className="login-error">{error}</p>}{msg && <p role="status" className="login-notice">{msg}</p>}
      <Button className="login-submit" onClick={resend} disabled={busy || !emailOk(email)}>{busy ? <LoaderCircle className="animate-spin" /> : <Mail />}{text("verify_resend")}</Button></div>
    <div className="login-bottom"><Link to="/login" className="auth-link">{text("back_login")}</Link></div>
  </AuthShell>;
}

export function ForgotPanel() {
  const text = useShoppingText(); const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(""); const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return; setMsg(""); setError("");
    if (!emailOk(email)) { setError(text("email_invalid")); return; }
    setBusy(true);
    try { const r = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` }); if (r.error) setError(text(authErrorKey(r.error))); else setMsg(text("reset_sent")); }
    catch { setError(text("auth_error")); } finally { setBusy(false); }
  };
  return <AuthShell title={text("forgot_title")} welcome={text("forgot_welcome")}>
    <form onSubmit={submit} className="login-form" noValidate>
      <label className="login-field"><Mail aria-hidden="true" /><input aria-label={text("email")} placeholder={text("email")} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></label>
      {error && <p role="alert" className="login-error">{error}</p>}{msg && <p role="status" className="login-notice">{msg}</p>}
      <Button type="submit" className="login-submit" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Send />}{text("reset_send")}</Button>
    </form>
    <div className="login-bottom"><Link to="/login" className="auth-link">{text("back_login")}</Link></div>
  </AuthShell>;
}
