import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Plug, KeyRound, Coins, ScanSearch, Sparkles, Server, ExternalLink, RefreshCw, Copy, Mail, MapPin, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SingleEditor, type Field } from "@/components/admin/editors";
import { PriceSource } from "@/components/admin/price-source";
import { SeoGoogle } from "@/components/admin/seo-google";
import { googleLoginSettings, saveGoogleLoginSettings } from "@/lib/google-login.functions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { externalConnectionsStatus } from "@/lib/external-connections.functions";
import { mailStatus, sendTestMail } from "@/lib/mail.functions";
import { seoBundleQuery } from "@/lib/seo-public.functions";
import { pagePath } from "@/lib/seo";

const services = [
  { id: "login", label: "تسجيل الدخول بـ Google", icon: KeyRound },
  { id: "prices", label: "مصدر أسعار المعادن", icon: Coins },
  { id: "search", label: "البحث والتحليلات", icon: ScanSearch },
  { id: "ai", label: "تحليل الأسعار بالذكاء الاصطناعي", icon: Sparkles },
  { id: "hosting", label: "اتصال الاستضافة", icon: Server },
  { id: "mail", label: "البريد الإلكتروني", icon: Mail },
  { id: "contact", label: "واتساب والبريد والخرائط", icon: MessageCircle },
] as const;
type Service = typeof services[number]["id"];
const bi = (base: string, a: string, e: string, type: Field["type"] = "text"): Field[] => [
  { name: `${base}_ar`, label: `${a} (العربية)`, type },
  { name: `${base}_en`, label: `${e} (English)`, type },
];

export function ExternalConnections() {
  const [selected, setSelected] = useState<Service>("login");
  const check = useServerFn(externalConnectionsStatus);
  const status = useQuery({ queryKey: ["external-connections-status"], queryFn: () => check(), staleTime: 30000 });
  const bundle = useQuery(seoBundleQuery);
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast.success("تم نسخ الرابط"); }
    catch { toast.error("تعذر النسخ؛ يمكنك تحديد الرابط ونسخه."); }
  };
  return <main dir="rtl" className="mx-auto min-h-screen max-w-6xl px-4 py-8 md:px-8">
    <header className="mb-8 border-b border-border pb-6">
      <Button variant="ghost" asChild className="mb-4"><Link to="/admin"><ArrowRight />لوحة التحكم</Link></Button>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-3 text-2xl font-semibold"><Plug className="text-gold" />الاتصالات الخارجية</h1>
        <Button variant="outline" disabled={status.isFetching} onClick={() => void status.refetch()}><RefreshCw className={status.isFetching ? "animate-spin" : ""} />فحص حالة الاتصال</Button>
      </div>
    </header>
    <nav aria-label="الخدمات الخارجية" className="mb-8 flex flex-wrap gap-2 border-b border-border pb-5">
      {services.map(service => <Button key={service.id} variant={selected === service.id ? "secondary" : "ghost"} aria-current={selected === service.id ? "page" : undefined} onClick={() => setSelected(service.id)} className="h-auto min-h-10 whitespace-normal text-start"><service.icon className="shrink-0" />{service.label}</Button>)}
    </nav>
    {status.error && <p role="alert" className="mb-6 text-destructive">{status.error.message}</p>}
    {selected === "login" && <section className="space-y-6">
      <div className="border-b border-border pb-6"><h2 className="mb-3 text-xl">تسجيل دخول العملاء بـ Google</h2>
        <p role="status" className="text-sm text-muted-foreground">{status.isPending ? "جارٍ التحقق…" : status.data ? status.data.googleEnabled ? "Google مفعّل في إعدادات تسجيل الدخول." : "Google غير مفعّل في إعدادات تسجيل الدخول." : "حالة Google غير متاحة؛ أعد فحص الاتصال."}</p>
        <p className="mt-3 text-sm">يظهر اختيار حساب Google قبل الدخول؛ لا تتغير صفحة دخول المسؤول.</p>
        <Button asChild variant="outline" className="mt-5"><Link to="/account" target="_blank"><ExternalLink />فتح صفحة دخول العملاء</Link></Button>
      </div>
      <GoogleKeysForm />
      <div className="space-y-4"><h3 className="font-semibold">ربط مفاتيح Google الخاصة بك</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">تُحفظ مفاتيح تسجيل الدخول في إعدادات الدخول الآمنة، وليس في إعدادات الموقع: افتح Lovable ← More ← Users ← Auth settings ← Sign In Methods ← Google، ثم استخدم بياناتك الخاصة واحفظ Client ID وClient Secret هناك.</p>
        <p className="text-sm leading-relaxed text-muted-foreground">في Google Cloud Console، أضف رابط العودة الظاهر في إعدادات Google إلى Authorized redirect URIs. هذا مختلف عن رابط عودة العميل إلى الموقع أدناه؛ لا تستبدل أحدهما بالآخر.</p>
        <Button asChild variant="outline"><a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"><KeyRound />فتح إعدادات Google</a></Button>
        <div className="rounded-md border border-border p-4 space-y-2"><h3 className="font-semibold">اختبار زر Google</h3><p className="text-sm text-muted-foreground">يفتح Google لاختيار حساب، ثم تظهر رسالة توضح نجاح الدخول أو سبب الرفض. انتبه: عند النجاح يتم الدخول بالحساب المختار.</p><GoogleTestButton /></div>
        <h3 className="pt-3 font-semibold">روابط عودة العميل المسموح بها</h3>
        {["https://goldcenterstr.com/auth/callback", "https://www.goldcenterstr.com/auth/callback"].map(url => <div key={url} className="flex items-center gap-3 border-b border-border py-3"><code dir="ltr" className="min-w-0 flex-1 break-all text-sm">{url}</code><Button size="icon" variant="ghost" title="نسخ الرابط" aria-label={`نسخ ${url}`} onClick={() => void copy(url)}><Copy /></Button></div>)}
        <p className="text-sm text-muted-foreground">أضف هذه الروابط في Auth settings ← Advanced ← Redirect URLs؛ يبقى goldcenterstr.com هو النطاق الأساسي.</p>
      </div>
    </section>}
    {selected === "prices" && <section><h2 className="mb-5 text-xl">Gold API — الأسعار والتوثيق</h2><PriceSource /></section>}
    {selected === "search" && <SeoGoogle lang="ar" bi={bi} paths={bundle.data?.seo.map(pagePath) ?? ["/"]} />}
    {selected === "ai" && <section className="space-y-4"><h2 className="text-xl">تحليل الأسعار بالذكاء الاصطناعي</h2><p role="status" className="text-sm text-muted-foreground">{status.data ? status.data.aiConfigured ? "إعداد التحليل متاح على هذه الاستضافة؛ تنفيذ التحليل يتم عند تحديث الأسعار." : "إعداد التحليل غير متاح على هذه الاستضافة." : "الحالة غير متاحة."}</p><p className="text-sm text-muted-foreground">التحليل مرتبط بمصدر الأسعار؛ لا تحتاج إلى إدخال مفتاح داخل الموقع، ولا تظهر المفاتيح السرية هنا.</p><Button variant="outline" onClick={() => setSelected("prices")}><Coins />مصدر الأسعار والتوثيق</Button></section>}
    {selected === "hosting" && <section className="space-y-5"><h2 className="text-xl">اتصال خدمات الاستضافة</h2><p role="status" className="text-sm text-muted-foreground">{status.data ? status.data.hostedBridgeConfigured ? "اتصال الخدمات المستضافة مضبوط؛ اختبر الخدمات من صفحاتها للتحقق من عملها." : "لا يوجد اتصال استضافة وسيط مضبوط على هذه النسخة؛ قد تعمل الخدمات مباشرة على Lovable." : "الحالة غير متاحة."}</p><p className="text-sm text-muted-foreground">إعداد الاتصال على هوستنجر يُحفظ في متغيرات الاستضافة، وليس في جدول عام. حالة الإعداد لا تعني نجاح طلبات الخدمة.</p><Button variant="outline" onClick={() => setSelected("search")}><ScanSearch />فحص خدمات Google</Button><Button asChild variant="outline"><Link to="/admin"><Server />إدارة المستخدمين من لوحة التحكم</Link></Button></section>}
    {selected === "mail" && <MailPanel />}
    {selected === "contact" && <section className="space-y-5"><h2 className="text-xl">قنوات التواصل</h2><div className="flex gap-4 text-gold"><MessageCircle /><Mail /><MapPin /></div><p className="text-sm text-muted-foreground">واتساب والخرائط يستخدمان روابط مباشرة ولا يحتاجان مفتاح API؛ البريد الحالي يفتح برنامج البريد ولا يرسل الرسائل تلقائيًا.</p><SingleEditor table="site_settings" id={1} queryKey={["settings"]} fields={[{ name: "whatsapp_number", label: "رقم واتساب (بالكود الدولي)", type: "whatsapp" }, { name: "service_whatsapp", label: "رقم واتساب الخدمات", type: "whatsapp" }, { name: "phone", label: "الهاتف" }, { name: "email", label: "البريد الإلكتروني" }]} /></section>}
  </main>;
}
const mailEnv = [
  { name: "SMTP_HOST", value: "smtp.hostinger.com", note: "سيرفر إرسال البريد" },
  { name: "SMTP_PORT", value: "465", note: "منفذ آمن" },
  { name: "SMTP_USER", value: "info@goldcenterstr.com", note: "البريد كاملًا" },
  { name: "SMTP_PASS", value: "كلمة مرور البريد", note: "سر — في الاستضافة فقط" },
  { name: "MAIL_TO", value: "البريد الذي تصله الرسائل", note: "اختياري" },
];

function MailPanel() {
  const check = useServerFn(mailStatus);
  const test = useServerFn(sendTestMail);
  const mail = useQuery({ queryKey: ["mail-status"], queryFn: () => check(), staleTime: 30000 });
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      const result = await test();
      if (result.sent) toast.success("وصلت رسالة الاختبار إلى بريد الاستلام.");
      else if (result.reason === "not_configured") toast.error("أضف بريد هوستنجر وكلمة مروره في متغيرات الاستضافة أولًا.");
      else toast.error(`تعذر الإرسال: ${result.reason ?? "سبب غير معروف"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر فحص البريد؛ حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };
  const ready = mail.data?.configured === true;
  return <section className="space-y-5">
    <h2 className="text-xl">البريد الإلكتروني للإرسال (SMTP)</h2>
    <p role="status" className="text-sm text-muted-foreground">{mail.isPending ? "جارٍ التحقق…" : mail.error ? mail.error.message : ready ? `البريد مضبوط على ${mail.data?.host}:${mail.data?.port} ويُرسل من ${mail.data?.from} إلى ${mail.data?.to}.` : "لم يُضبط بريد الإرسال بعد."}</p>
    <p className="text-sm text-muted-foreground">الضبط يتم في متغيرات الاستضافة على هوستنجر، ولا تُدخل كلمة المرور هنا ولا في أي صفحة من الموقع. بعد الحفظ أعد تشغيل نسخة هوستنجر، ثم اضغط زر الاختبار.</p>
    <div className="rounded-md border border-border p-4 space-y-2">
      <h3 className="font-semibold">المتغيرات المطلوبة</h3>
      {mailEnv.map(item => <div key={item.name} className="flex flex-wrap items-center gap-3 border-b border-border py-2 last:border-0">
        <code dir="ltr" className="text-sm">{item.name}</code>
        <span className="min-w-0 flex-1 text-sm text-muted-foreground">{item.note}{item.value ? ` — مثال: ${item.value}` : ""}</span>
      </div>)}
    </div>
    <div className="flex flex-wrap gap-3">
      <Button onClick={run} disabled={busy || mail.isPending || !ready}><Mail />{busy ? "جارٍ الإرسال…" : "إرسال رسالة اختبار"}</Button>
      <Button variant="outline" disabled={mail.isFetching} onClick={() => void mail.refetch()}><RefreshCw className={mail.isFetching ? "animate-spin" : ""} />إعادة فحص البريد</Button>
    </div>
    <p className="text-sm text-muted-foreground">رسائل استمارات التواصل تصل تلقائيًا إلى بريد الاستلام عند ضبط المتغيرات. صفحة دخول المسؤول وحسابات العملاء لا تتأثر.</p>
  </section>;
}

function GoogleTestButton() {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    sessionStorage.setItem("gold-center-google-test", "1");
    const { siteGoogleLoginEnabled } = await import("@/components/google-sign-in");
    if (await siteGoogleLoginEnabled()) { window.location.assign("/api/public/google-login?start=1"); return; }
    const redirect = `${window.location.origin}/auth/callback`;
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirect, queryParams: { prompt: "select_account" } } });
    if (error) { sessionStorage.removeItem("gold-center-google-test"); setBusy(false); toast.error(`رفض Google الطلب: ${error.message}`); }
  };
  return <Button onClick={run} disabled={busy}><KeyRound />{busy ? "جارٍ التحويل إلى Google…" : "اختبار الدخول بـ Google"}</Button>;
}

const callbackUris = ["https://goldcenterstr.com/api/public/google-login", "https://www.goldcenterstr.com/api/public/google-login", "https://bullion-content-compass.lovable.app/api/public/google-login"];
function GoogleKeysForm() {
  const load = useServerFn(googleLoginSettings); const save = useServerFn(saveGoogleLoginSettings); const qc = useQueryClient();
  const current = useQuery({ queryKey: ["google-login-settings"], queryFn: () => load() });
  const [clientId, setClientId] = useState<string | null>(null); const [secret, setSecret] = useState(""); const [enabled, setEnabled] = useState<boolean | null>(null);
  const id = clientId ?? current.data?.clientId ?? ""; const on = enabled ?? current.data?.enabled ?? true;
  const mutation = useMutation({
    mutationFn: () => save({ data: { clientId: id, clientSecret: secret, enabled: on } }),
    onSuccess: async () => { setSecret(""); await qc.invalidateQueries({ queryKey: ["google-login-settings"] }); toast.success(on ? "تم الحفظ وتفعيل الدخول بـ Google" : "تم الحفظ؛ الدخول بـ Google متوقف"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const ready = !!current.data?.hasSecret && !!current.data.clientId && current.data.enabled;
  return <form className="space-y-4 rounded-md border border-border p-4" onSubmit={(e) => { e.preventDefault(); if (!current.data?.hasSecret && !secret) { toast.error("الصق Client Secret أولًا."); return; } mutation.mutate(); }}>
    <h3 className="font-semibold">مفاتيح Google (تفعيل مباشر من لوحة التحكم)</h3>
    <p role="status" className="text-sm text-muted-foreground">{current.isPending ? "جارٍ التحميل…" : current.error ? current.error.message : ready ? "الدخول بـ Google يعمل بمفاتيحك." : "لم يكتمل الإعداد بعد."}</p>
    <label className="block space-y-1 text-sm"><span>Client ID</span><Input dir="ltr" value={id} onChange={e => setClientId(e.target.value)} placeholder="xxxx.apps.googleusercontent.com" autoComplete="off" required /></label>
    <label className="block space-y-1 text-sm"><span>Client Secret</span><Input dir="ltr" type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder={current.data?.hasSecret ? "محفوظ — اتركه فارغًا للإبقاء عليه" : "GOCSPX-..."} autoComplete="new-password" /></label>
    <label className="flex items-center gap-3 text-sm"><Switch checked={on} onCheckedChange={setEnabled} />تفعيل الدخول بـ Google</label>
    <Button type="submit" disabled={mutation.isPending || current.isPending}>{mutation.isPending ? "جارٍ الحفظ…" : "حفظ وتفعيل"}</Button>
    <div className="space-y-1 text-sm"><p className="text-muted-foreground">أضف هذه الروابط في Google Cloud Console ← Credentials ← تطبيقك ← Authorized redirect URIs:</p>
      {callbackUris.map(u => <code key={u} dir="ltr" className="block break-all">{u}</code>)}</div>
  </form>;
}
