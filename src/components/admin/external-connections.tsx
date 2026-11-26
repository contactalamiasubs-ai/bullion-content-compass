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
import { externalConnectionsStatus } from "@/lib/external-connections.functions";
import { seoBundleQuery } from "@/lib/seo-public.functions";
import { pagePath } from "@/lib/seo";

const services = [
  { id: "login", label: "تسجيل الدخول بـ Google", icon: KeyRound },
  { id: "prices", label: "مصدر أسعار المعادن", icon: Coins },
  { id: "search", label: "البحث والتحليلات", icon: ScanSearch },
  { id: "ai", label: "تحليل الأسعار بالذكاء الاصطناعي", icon: Sparkles },
  { id: "hosting", label: "اتصال الاستضافة", icon: Server },
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
    {selected === "contact" && <section className="space-y-5"><h2 className="text-xl">قنوات التواصل</h2><div className="flex gap-4 text-gold"><MessageCircle /><Mail /><MapPin /></div><p className="text-sm text-muted-foreground">واتساب والخرائط يستخدمان روابط مباشرة ولا يحتاجان مفتاح API؛ البريد الحالي يفتح برنامج البريد ولا يرسل الرسائل تلقائيًا.</p><SingleEditor table="site_settings" id={1} queryKey={["settings"]} fields={[{ name: "whatsapp_number", label: "رقم واتساب (بالكود الدولي)", type: "whatsapp" }, { name: "service_whatsapp", label: "رقم واتساب الخدمات", type: "whatsapp" }, { name: "phone", label: "الهاتف" }, { name: "email", label: "البريد الإلكتروني" }]} /></section>}
  </main>;
}
function GoogleTestButton() {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    sessionStorage.setItem("gold-center-google-test", "1");
    const redirect = `${window.location.origin}/auth/callback`;
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirect, queryParams: { prompt: "select_account" } } });
    if (error) { sessionStorage.removeItem("gold-center-google-test"); setBusy(false); toast.error(`رفض Google الطلب: ${error.message}`); }
  };
  return <Button onClick={run} disabled={busy}><KeyRound />{busy ? "جارٍ التحويل إلى Google…" : "اختبار الدخول بـ Google"}</Button>;
}
