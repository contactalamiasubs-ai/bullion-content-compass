import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UsersRound, UserPlus, Activity, Heart, ShoppingBag, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { customerAnalytics } from "@/lib/customers.functions";
import { customerEventLabels } from "@/lib/customer-accounts";
import { productsQuery } from "@/lib/data";

export function CustomerAnalytics() {
  const inspect = useServerFn(customerAnalytics);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const query = useQuery({ queryKey: ["customer-analytics", days], queryFn: () => inspect({ data: { days } }) });
  const products = useQuery(productsQuery);
  const data = query.data;
  const metrics = data ? [
    { label: "إجمالي الحسابات", value: data.total, icon: UsersRound }, { label: "تسجيلات خلال الفترة", value: data.registered, icon: UserPlus },
    { label: "عملاء نشطون خلال الفترة", value: data.active, icon: Activity }, { label: "أحداث مسجلة خلال الفترة", value: data.events, icon: Eye },
    { label: "عملاء لديهم سلة", value: data.withCart, icon: ShoppingBag }, { label: "عملاء لديهم مفضلة", value: data.withFavorites, icon: Heart },
  ] : [];
  return <section className="space-y-6 border-b border-border pb-8">
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="flex items-center gap-2 text-xl"><Activity className="text-gold" />تحليلات العملاء</h2>
      <div className="flex flex-wrap items-center gap-2"><select aria-label="فترة التحليل" className="rounded-md border border-input bg-background px-3 py-2" value={days} onChange={event => { const value = Number(event.target.value); if (value === 7 || value === 30 || value === 90) setDays(value); }}><option value={7}>آخر ٧ أيام</option><option value={30}>آخر ٣٠ يومًا</option><option value={90}>آخر ٩٠ يومًا</option></select><Button variant="outline" size="icon" aria-label="تحديث التحليلات" title="تحديث التحليلات" disabled={query.isFetching} onClick={() => { void query.refetch(); }}><RefreshCw className={query.isFetching ? "animate-spin" : ""} /></Button></div>
    </div>
    {query.isPending && <p role="status">جارٍ تحميل التحليلات…</p>}{query.error && <p role="alert" className="text-destructive">{query.error.message}</p>}
    {data && <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="min-w-0 rounded-lg border border-border bg-card p-4"><Icon className="mb-3 size-5 text-gold" /><p className="text-3xl font-semibold">{value.toLocaleString("ar-EG")}</p><p className="mt-2 text-sm text-muted-foreground">{label}</p></div>)}</div>
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm"><p>القطع في السلال الحالية: <strong className="text-gold">{data.cartQuantity.toLocaleString("ar-EG")}</strong></p><p>المنتجات في المفضلة الحالية: <strong className="text-gold">{data.favorites.toLocaleString("ar-EG")}</strong></p><time className="text-muted-foreground">آخر تحديث: {new Date(data.updatedAt).toLocaleString("ar-EG")}</time></div>
      <div className="grid gap-8 lg:grid-cols-2"><div><h3 className="mb-4 text-lg">التسجيلات والنشاط اليومي</h3><div className="max-h-72 overflow-auto space-y-3 pe-2">{data.daily.filter(row => row.registrations || row.events).map(row => <div key={row.date} className="space-y-1 text-sm"><div className="flex justify-between gap-2"><time>{new Date(`${row.date}T00:00:00Z`).toLocaleDateString("ar-EG")}</time><span>{row.registrations} تسجيل · {row.events} نشاط</span></div><progress aria-label={`النشاط ${row.date}`} value={row.events + row.registrations} max={Math.max(1, ...data.daily.map(day => day.events + day.registrations))} className="h-2 w-full accent-primary" /></div>)}{!data.events && !data.registered && <p className="text-muted-foreground">لا توجد تسجيلات أو أحداث خلال هذه الفترة.</p>}</div></div>
      <div><h3 className="mb-4 text-lg">توزيع النشاط</h3><div className="divide-y divide-border">{Object.entries(data.eventCounts).sort((a, b) => b[1] - a[1]).map(([event, count]) => <div key={event} className="flex justify-between gap-3 py-3 text-sm"><span>{customerEventLabels[event] ?? event}</span><strong>{count.toLocaleString("ar-EG")}</strong></div>)}{!data.events && <p className="text-muted-foreground">لا يوجد نشاط مسجل خلال الفترة.</p>}</div></div></div>
      <div><h3 className="mb-4 text-lg">المنتجات الأكثر اهتمامًا</h3><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-right text-sm"><thead className="border-b border-border text-muted-foreground"><tr><th className="py-3">المنتج</th><th>مشاهدات الفترة</th><th>المفضلة الحالية</th><th>قطع السلة الحالية</th></tr></thead><tbody className="divide-y divide-border">{data.popular.map(row => <tr key={row.id}><td className="max-w-60 py-3 pe-4">{products.data?.find(product => product.id === row.id)?.name_ar ?? "منتج غير متاح"}</td><td>{row.views}</td><td>{row.favorites}</td><td>{row.cartQuantity}</td></tr>)}</tbody></table></div>{!data.popular.length && <p className="py-4 text-muted-foreground">لا توجد بيانات منتجات بعد.</p>}</div>
    </>}
  </section>;
}