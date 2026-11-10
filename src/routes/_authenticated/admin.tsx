import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Settings, Images, Coins, LineChart, FileText, Briefcase, Package, Newspaper, Mail, LogOut, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SingleEditor, ListEditor, type Field } from "@/components/admin/editors";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم" },
      { name: "description", content: "إدارة محتوى الموقع." },
      { property: "og:title", content: "لوحة التحكم" },
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
  { id: "settings", l: "الإعدادات العامة", i: Settings },
  { id: "popup", l: "النافذة المنبثقة", i: Images },
  { id: "slides", l: "السلايدر", i: Images },
  { id: "prices", l: "الأسعار", i: Coins },
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
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("settings");
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: async () => (await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })).data ?? false,
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
        <div><p className="mb-4">هذا الحساب ليس له صلاحية المسؤول.</p><button onClick={signOut} className="text-gold">تسجيل الخروج</button></div>
      </div>
    );
  return (
    <div dir="rtl" className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-sidebar-border bg-sidebar p-4 md:flex">
        <h1 className="mb-6 text-xl text-gold-gradient">لوحة التحكم</h1>
        <nav className="flex-1 space-y-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm ${tab === t.id ? "bg-sidebar-accent text-gold" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
              <t.i className="h-4 w-4" /> {t.l}
            </button>
          ))}
        </nav>
        <Link to="/" target="_blank" className="mb-2 flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-gold"><ExternalLink className="h-4 w-4" /> عرض الموقع</Link>
        <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-destructive"><LogOut className="h-4 w-4" /> خروج</button>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <select value={tab} onChange={(e) => setTab(e.target.value as typeof tab)} className="mb-4 w-full rounded-md border border-input bg-background px-3 py-2 md:hidden">
          {tabs.map((t) => <option key={t.id} value={t.id}>{t.l}</option>)}
        </select>
        <h2 className="mb-6 text-2xl">{tabs.find((t) => t.id === tab)?.l}</h2>
        <Panel tab={tab} />
      </main>
    </div>
  );
}

function Panel({ tab }: { tab: string }) {
  switch (tab) {
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

function Messages() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin", "messages"], queryFn: async () => (await supabase.from("contact_messages").select("*").order("created_at", { ascending: false })).data ?? [] });
  const del = async (id: string) => { await supabase.from("contact_messages").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["admin", "messages"] }); };
  if (!data.length) return <p className="text-muted-foreground">لا توجد رسائل بعد.</p>;
  return (
    <div className="space-y-3">
      {data.map((m) => (
        <div key={m.id} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
            <span className="font-semibold">{m.name} — <span dir="ltr">{m.email}</span> {m.phone && <span dir="ltr">· {m.phone}</span>}</span>
            <span className="text-muted-foreground">{new Date(m.created_at).toLocaleString("ar-EG")}</span>
          </div>
          <p className="whitespace-pre-line text-muted-foreground">{m.message}</p>
          <button onClick={() => del(m.id)} className="mt-2 text-xs text-destructive">حذف</button>
        </div>
      ))}
    </div>
  );
}
