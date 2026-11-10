import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Settings, Images, Coins, LineChart, FileText, Briefcase, Package, Newspaper, Mail, LogOut, ExternalLink, LayoutDashboard, ShieldCheck, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SingleEditor, ListEditor, type Field } from "@/components/admin/editors";
import { useServerFn } from "@tanstack/react-start";
import { refreshVerifiedPrices } from "@/lib/prices.functions";
import { verifiedPricesQuery } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم | جولد سنتر" },
      { name: "description", content: "إدارة محتوى الموقع." },
      { property: "og:title", content: "لوحة التحكم | جولد سنتر" },
      { property: "og:description", content: "إدارة محتوى الموقع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const bi = (base: string, label: string, type: Field["type"] = "text"): Field[] => [
  { name: `${base}_ar`, label: `${label} (عربي)`, type },
  { name: `${base}_en`, label: `${label} (English)`, type },
];

const tabs = [
  { id: "overview", l: "نظرة عامة", i: LayoutDashboard },
  { id: "settings", l: "الإعدادات العامة", i: Settings },
  { id: "popup", l: "النافذة المنبثقة", i: Images },
  { id: "slides", l: "السلايدر", i: Images },
  { id: "prices", l: "الأسعار", i: Coins },
  { id: "source", l: "مصدر الأسعار والتوثيق", i: Coins },
  { id: "history", l: "سجل الأسعار", i: LineChart },
  { id: "sections", l: "أقسام الموقع", i: FileText },
  { id: "services", l: "الخدمات", i: Briefcase },
  { id: "products", l: "المنتجات", i: Package },
  { id: "posts", l: "المدونة والأخبار", i: Newspaper },
  { id: "messages", l: "رسائل التواصل", i: Mail },
] as const;

function Admin() {
  const { user } = Route.useRouteContext();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (error) throw error;
      return data ?? false;
    },
  });
  const signOut = async () => {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };
  if (isLoading) return <div dir="rtl" className="p-10 text-center text-muted-foreground">جارٍ التحميل...</div>;
  if (!isAdmin)
    return (
      <div dir="rtl" className="grid min-h-screen place-items-center text-center">
        <div><p className="mb-4">هذا الحساب ليس له صلاحية المسؤول.</p><Button onClick={signOut} variant="outline">تسجيل الخروج</Button></div>
      </div>
    );
  return (
    <div dir="rtl" className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-sidebar-border bg-sidebar p-4 md:flex">
        <h1 className="mb-1 text-2xl text-gold-gradient">جولد سنتر</h1>
        <p className="mb-6 text-xs text-muted-foreground">إدارة الموقع</p>
        <nav aria-label="أقسام لوحة التحكم" className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {tabs.map((t) => (
            <Button variant="ghost" key={t.id} aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)} className={`h-auto min-h-10 w-full justify-start whitespace-normal px-3 py-2 text-sm ${tab === t.id ? "bg-sidebar-accent text-gold" : "text-sidebar-foreground"}`}>
              <t.i className="h-4 w-4" /> {t.l}
            </Button>
          ))}
        </nav>
        <Link to="/" target="_blank" className="mb-2 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-gold"><ExternalLink className="h-4 w-4" /> عرض الموقع</Link>
        <Button variant="ghost" onClick={signOut} className="justify-start text-muted-foreground hover:text-destructive"><LogOut /> خروج</Button>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
          <div className="min-w-0"><p className="text-xs text-gold">لوحة تحكم جولد سنتر</p><p dir="ltr" className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p></div>
          <div className="flex gap-2"><Button asChild variant="outline"><Link to="/" target="_blank"><ExternalLink />عرض الموقع</Link></Button><Button variant="ghost" size="icon" onClick={signOut} aria-label="تسجيل الخروج" title="تسجيل الخروج"><LogOut /></Button></div>
        </header>
        <select aria-label="قسم لوحة التحكم" value={tab} onChange={(e) => setTab(e.target.value as typeof tab)} className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2 md:hidden">
          {tabs.map((t) => <option key={t.id} value={t.id}>{t.l}</option>)}
        </select>
        <h2 className="mb-6 text-2xl">{tabs.find((t) => t.id === tab)?.l}</h2>
        <Panel key={tab} tab={tab} onSelect={setTab} />
      </main>
    </div>
  );
}

type TabId = (typeof tabs)[number]["id"];

function Panel({ tab, onSelect }: { tab: string; onSelect: (tab: TabId) => void }) {
  switch (tab) {
    case "overview":
      return <Overview onSelect={onSelect} />;
    case "source":
      return <PriceSource />;
    case "settings":
      return <SingleEditor table="site_settings" id={1} queryKey={["settings"]} fields={[
        ...bi("site_name", "اسم الموقع"), { name: "logo_url", label: "اللوجو", type: "image" },
        { name: "whatsapp_number", label: "رقم واتساب (بالكود الدولي، مثال 2010...)" }, { name: "phone", label: "الهاتف" }, { name: "email", label: "البريد" },
        ...bi("address", "العنوان"), { name: "facebook", label: "فيسبوك" }, { name: "instagram", label: "إنستجرام" }, { name: "youtube", label: "يوتيوب" }, { name: "tiktok", label: "تيك توك" },
        { name: "gold_usd", label: "سعر أوقية الذهب (USD)", type: "number" }, { name: "silver_usd", label: "سعر أوقية الفضة (USD)", type: "number" },
        { name: "years_experience", label: "سنوات الخبرة", type: "number" }, { name: "app_link", label: "رابط تحميل التطبيق" },
      ]} />;
    case "popup":
      return <SingleEditor table="site_settings" id={1} queryKey={["settings"]} fields={[
        { name: "popup_enabled", label: "إظهار النافذة", type: "bool" }, ...bi("popup_title", "العنوان"), ...bi("popup_button", "نص الزر"), { name: "popup_link", label: "الرابط" },
      ]} />;
    case "slides":
      return <ListEditor table="slides" order="sort" titleField="title_ar" queryKey={["slides"]} newRow={{ title_ar: "شريحة جديدة", title_en: "New slide", sort: 99 }} fields={[
        ...bi("title", "العنوان"), ...bi("body", "الوصف", "textarea"), ...bi("button", "نص الزر"), { name: "link", label: "رابط الزر" },
        { name: "image_url", label: "الصورة", type: "image" }, { name: "sort", label: "الترتيب", type: "number" }, { name: "active", label: "ظاهرة", type: "bool" },
      ]} />;
    case "prices":
      return <ListEditor table="metal_prices" order="sort" titleField="name_ar" queryKey={["prices"]} newRow={{ name_ar: "منتج جديد", name_en: "New item", sort: 99 }} fields={[
        ...bi("name", "الاسم"), { name: "sell", label: "سعر البيع (EGP)", type: "number" }, { name: "buy", label: "سعر الشراء (EGP)", type: "number" }, { name: "sort", label: "الترتيب", type: "number" },
      ]} />;
    case "history":
      return <ListEditor table="price_history" order="day" ascending={false} titleField="day" queryKey={["history"]} newRow={{ day: new Date().toISOString().slice(0, 10), usd: 0, egp: 0 }} fields={[
        { name: "day", label: "التاريخ", type: "date" }, { name: "usd", label: "سعر الأوقية USD", type: "number" }, { name: "egp", label: "سعر الجرام EGP", type: "number" },
      ]} />;
    case "sections":
      return <ListEditor table="sections" pk="key" order="key" titleField="title_ar" queryKey={["sections"]} canAdd={false} fields={[
        ...bi("title", "العنوان"), ...bi("body", "النص", "textarea"), { name: "image_url", label: "صورة", type: "image" },
      ]} />;
    case "services":
      return <ListEditor table="services" order="sort" titleField="title_ar" queryKey={["services"]} newRow={{ title_ar: "خدمة جديدة", title_en: "New service", sort: 99 }} fields={[
        ...bi("title", "العنوان"), ...bi("body", "الوصف", "textarea"), { name: "image_url", label: "الصورة", type: "image" }, { name: "sort", label: "الترتيب", type: "number" },
      ]} />;
    case "products":
      return <ListEditor table="products" order="sort" titleField="name_ar" queryKey={["products"]} newRow={{ name_ar: "منتج جديد", name_en: "New product", sort: 99 }} fields={[
        ...bi("name", "الاسم"), ...bi("description", "الوصف", "textarea"), { name: "price", label: "السعر (اختياري)", type: "number" },
        { name: "image_url", label: "الصورة", type: "image" }, { name: "sort", label: "الترتيب", type: "number" }, { name: "active", label: "ظاهر", type: "bool" },
      ]} />;
    case "posts":
      return <ListEditor table="posts" order="created_at" ascending={false} titleField="title_ar" queryKey={["posts"]} newRow={{ title_ar: "مقال جديد", title_en: "New post", slug: `post-${Date.now()}`, published: false }} fields={[
        { name: "kind", label: "النوع", type: "select", options: ["blog", "news"] }, { name: "slug", label: "الرابط المختصر (إنجليزي بدون مسافات)" },
        ...bi("title", "العنوان"), ...bi("excerpt", "الملخص", "textarea"), ...bi("body", "المحتوى", "textarea"),
        { name: "image_url", label: "الصورة", type: "image" }, { name: "published", label: "منشور", type: "bool" },
      ]} />;
    case "messages":
      return <Messages />;
  }
  return null;
}

function PriceSource() {
  const qc = useQueryClient();
  const refresh = useServerFn(refreshVerifiedPrices);
  const [busy, setBusy] = useState(false);
  const { data: updates = [] } = useQuery(verifiedPricesQuery);
  return <div className="space-y-6">
    <SingleEditor table="site_settings" id={1} queryKey={["settings"]} fields={[
      { name: "price_source_enabled", label: "تفعيل مصدر Gold API", type: "bool" },
      { name: "gold_source_url", label: "مصدر الذهب (https://api.gold-api.com/price/XAU)" },
      { name: "silver_source_url", label: "مصدر الفضة (https://api.gold-api.com/price/XAG)" },
    ]} />
    <Button disabled={busy} onClick={async () => {
      setBusy(true);
      try { await refresh(); await Promise.all([qc.invalidateQueries({ queryKey: ["settings"] }), qc.invalidateQueries({ queryKey: ["verified-prices"] }), qc.invalidateQueries({ queryKey: ["admin", "site_settings"] })]); toast.success("تم توثيق وتحديث أسعار الذهب والفضة"); }
      catch (err) { toast.error(err instanceof Error ? err.message : "تعذر تحديث الأسعار"); }
      finally { setBusy(false); }
    }}><Coins />{busy ? "جارٍ التحليل والتوثيق…" : "جلب الأسعار وتحليلها وتحديثها"}</Button>
    {updates.map(update => <div key={update.id} className="space-y-2 border-t border-border py-4">
      <p dir="ltr">XAU: {update.gold_usd} USD · XAG: {update.silver_usd} USD</p>
      <p>{new Date(update.verified_at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}</p>
      <p className="text-sm text-muted-foreground">{update.summary_ar}</p>
      <p className="text-xs text-muted-foreground">وقت مصدر الذهب: {new Date(update.gold_source_at).toLocaleString("ar-EG")} · الفضة: {new Date(update.silver_source_at).toLocaleString("ar-EG")}</p>
    </div>)}
  </div>;
}

function Overview({ onSelect }: { onSelect: (tab: TabId) => void }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("slides").select("id", { count: "exact", head: true }),
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
      ]);
      for (const result of results) if (result.error) throw result.error;
      return results.map(result => result.count ?? 0);
    },
  });
  const metrics = [
    { label: "المنتجات", icon: Package, tab: "products" },
    { label: "الشرائح", icon: Images, tab: "slides" },
    { label: "المقالات والأخبار", icon: Newspaper, tab: "posts" },
    { label: "رسائل التواصل", icon: Mail, tab: "messages" },
  ] as const;
  return <div className="space-y-8">
    <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm text-success"><ShieldCheck className="h-4 w-4" />حساب مسؤول</p><Button variant="ghost" size="icon" aria-label="تحديث الملخص" title="تحديث الملخص" onClick={() => refetch()}><RefreshCw /></Button></div>
    {error && <p role="alert" className="text-destructive">تعذر تحميل الملخص: {error.message}</p>}
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {metrics.map((metric, index) => <Button key={metric.tab} variant="outline" onClick={() => onSelect(metric.tab)} className="h-auto min-h-32 flex-col items-start gap-3 whitespace-normal bg-card p-5">
        <span className="flex w-full items-center justify-between gap-2 text-muted-foreground"><span>{metric.label}</span><metric.icon /></span>
        <span className="text-3xl font-semibold text-gold">{isLoading || error ? "—" : data?.[index]}</span>
      </Button>)}
    </div>
    <section className="border-t border-border pt-6"><h3 className="mb-4 text-xl">إدارة المحتوى</h3><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {tabs.filter(t => t.id !== "overview").map(t => <Button key={t.id} variant="ghost" onClick={() => onSelect(t.id)} className="h-auto min-h-14 justify-start whitespace-normal border-b border-border rounded-none"><t.i className="text-gold" />{t.l}</Button>)}
    </div></section>
  </div>;
}

function Messages() {
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const { data = [], isLoading, error } = useQuery({ queryKey: ["admin", "messages"], queryFn: async () => {
    const result = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (result.error) throw result.error;
    return result.data ?? [];
  } });
  const del = async (id: string) => {
    if (!confirm("حذف هذه الرسالة؟")) return;
    setDeleting(id);
    try {
      const result = await supabase.from("contact_messages").delete().eq("id", id);
      if (result.error) throw result.error;
      toast.success("تم حذف الرسالة");
      void qc.invalidateQueries({ queryKey: ["admin", "messages"] });
      void qc.invalidateQueries({ queryKey: ["admin-overview"] });
    } catch (err) { toast.error(err instanceof Error ? err.message : "تعذر حذف الرسالة"); }
    finally { setDeleting(null); }
  };
  if (isLoading) return <p className="text-muted-foreground">جارٍ تحميل الرسائل…</p>;
  if (error) return <p role="alert" className="text-destructive">تعذر تحميل الرسائل: {error.message}</p>;
  if (!data.length) return <p className="text-muted-foreground">لا توجد رسائل بعد.</p>;
  return <div className="space-y-3">
    {data.map(m => <div key={m.id} className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm">
        <div className="min-w-0"><p className="font-semibold">{m.name}</p><a className="break-all text-gold" dir="ltr" href={`mailto:${m.email}`}>{m.email}</a>{m.phone && <p dir="ltr">{m.phone}</p>}</div>
        <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("ar-EG")}</span>
      </div>
      <p className="whitespace-pre-line break-words text-muted-foreground">{m.message}</p>
      <Button disabled={deleting === m.id} variant="ghost" size="sm" onClick={() => del(m.id)} className="mt-3 text-destructive"><Trash2 />حذف</Button>
    </div>)}
  </div>;
}
