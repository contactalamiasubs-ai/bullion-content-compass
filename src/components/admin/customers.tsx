import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { UsersRound, Heart, ShoppingBag, ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inspectCustomers } from "@/lib/customers.functions";
import { productsQuery } from "@/lib/data";
import { readShopping } from "@/lib/shopping";
import { customerEventLabels } from "@/lib/customer-accounts";

export function Customers() {
  const inspect = useServerFn(inspectCustomers);
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const [userId, setUserId] = useState<string>(); const [activityPage, setActivityPage] = useState(1);
  const query = useQuery({ queryKey: ["customers", page, search, userId, activityPage], queryFn: () => inspect({ data: { page, search, userId, activityPage } }) });
  const products = useQuery(productsQuery);
  const [selectedName, setSelectedName] = useState("");
  const shopping = readShopping(JSON.stringify(query.data?.shopping));
  const productName = (id: string) => products.data?.find((p) => p.id === id)?.name_ar ?? "منتج محذوف أو غير موجود";
  return <div className="space-y-8">
    <label className="block space-y-2 text-sm"><span>البحث ببريد العميل</span><input type="search" aria-label="البحث ببريد العميل" dir="ltr" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full rounded-md border border-input bg-background px-3 py-2" /></label>
    {query.isPending && <p role="status">جارٍ تحميل العملاء…</p>}
    {query.error && <p role="alert" className="text-destructive">{query.error.message}</p>}
    <div className="divide-y divide-border">
      {query.data?.profiles.map((profile) => <div key={profile.id} className="flex flex-wrap items-center gap-3 py-4">
        {profile.avatar_url?.startsWith("https://") ? <img src={profile.avatar_url} alt="" referrerPolicy="no-referrer" className="size-10 rounded-full object-cover" /> : <UserRound className="size-10 text-gold" />}
        <div className="min-w-0 flex-1"><h3 className="break-words">{profile.display_name || "حساب عميل"}</h3><p dir="ltr" className="break-all text-sm text-muted-foreground">{profile.email}</p><p className="text-xs text-muted-foreground">تاريخ التسجيل: {new Date(profile.created_at).toLocaleDateString("ar-EG")}</p></div>
        <Button variant={userId === profile.id ? "default" : "outline"} onClick={() => { setUserId(profile.id); setSelectedName(profile.display_name || profile.email); setActivityPage(1); }}><UsersRound />عرض نشاط العميل</Button>
      </div>)}
    </div>
    {query.data?.count === 0 && <p>لا توجد حسابات مطابقة.</p>}
    <div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="العملاء السابقون" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronRight /></Button><span>{page} / {Math.max(1, Math.ceil((query.data?.count ?? 0) / 20))}</span><Button variant="outline" size="icon" aria-label="العملاء التاليون" disabled={page * 20 >= (query.data?.count ?? 0)} onClick={() => setPage(page + 1)}><ChevronLeft /></Button></div>
    {userId && query.data && <section className="space-y-6 border-t border-border pt-8">
      <h3 className="break-all text-xl text-gold">{selectedName}</h3>
      <div className="grid gap-8 sm:grid-cols-2">
        <div><h4 className="mb-3 flex items-center gap-2"><ShoppingBag />السلة الحالية</h4>{!Object.keys(shopping.cart).length && <p className="text-muted-foreground">السلة فارغة</p>}{Object.entries(shopping.cart).map(([id, quantity]) => <p key={id} className="py-2"><Link to="/products/$id" params={{ id }} className="hover:text-gold">{productName(id)}</Link> — الكمية: {quantity}</p>)}</div>
        <div><h4 className="mb-3 flex items-center gap-2"><Heart />المفضلة الحالية</h4>{!shopping.favorites.length && <p className="text-muted-foreground">لا توجد منتجات مفضلة</p>}{shopping.favorites.map((id) => <p key={id} className="py-2"><Link to="/products/$id" params={{ id }} className="hover:text-gold">{productName(id)}</Link></p>)}</div>
      </div>
      <h4 className="text-lg">سجل النشاط ({query.data.activityCount})</h4>
      <div className="divide-y divide-border">{query.data.activity.map((event) => <div key={event.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><p>{customerEventLabels[event.event] ?? event.event}{event.product_id && <> — {productName(event.product_id)}</>}{event.quantity != null && <> — الكمية: {event.quantity}</>}</p><time className="text-muted-foreground">{new Date(event.created_at).toLocaleString("ar-EG")}</time></div>)}</div>
      {!query.data.activityCount && <p className="text-muted-foreground">لا يوجد نشاط مسجل بعد.</p>}
      <div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="النشاط السابق" disabled={activityPage === 1} onClick={() => setActivityPage(activityPage - 1)}><ChevronRight /></Button><span>{activityPage}</span><Button variant="outline" size="icon" aria-label="النشاط التالي" disabled={activityPage * 30 >= query.data.activityCount} onClick={() => setActivityPage(activityPage + 1)}><ChevronLeft /></Button><Button variant="ghost" onClick={() => { void query.refetch(); }}>تحديث</Button></div>
    </section>}
  </div>;
}