import type { Database } from "@/integrations/supabase/types";
import { readShopping } from "@/lib/shopping";
import { customerEventLabels } from "@/lib/customer-accounts";
type Tables = Database["public"]["Tables"];
export type CustomerExport = {
  profiles: Tables["profiles"]["Row"][];
  shopping: Tables["customer_shopping"]["Row"][];
  activity: Tables["customer_activity"]["Row"][];
  products: { id: string; name_ar: string }[];
  exportedAt: string;
};
export function customerExportSheets(data: CustomerExport) {
  const names = new Map(data.profiles.map(row => [row.id, row.email]));
  const products = new Map(data.products.map(row => [row.id, row.name_ar]));
  const cart: (string | number | null)[][] = [], favorites: (string | number | null)[][] = [];
  for (const row of data.shopping) {
    const state = readShopping(JSON.stringify(row));
    for (const [id, quantity] of Object.entries(state.cart)) cart.push([row.user_id, names.get(row.user_id) ?? "", id, products.get(id) ?? "منتج غير موجود", quantity, row.updated_at]);
    for (const id of state.favorites) favorites.push([row.user_id, names.get(row.user_id) ?? "", id, products.get(id) ?? "منتج غير موجود", row.updated_at]);
  }
  return [
    { name: "العملاء", headers: ["معرّف العميل", "الاسم", "البريد الإلكتروني", "رابط الصورة", "تاريخ التسجيل"], rows: data.profiles.map(row => [row.id, row.display_name, row.email, row.avatar_url, row.created_at]) },
    { name: "السلة", headers: ["معرّف العميل", "البريد الإلكتروني", "معرّف المنتج", "المنتج", "الكمية", "آخر تعديل"], rows: cart },
    { name: "المفضلة", headers: ["معرّف العميل", "البريد الإلكتروني", "معرّف المنتج", "المنتج", "آخر تعديل"], rows: favorites },
    { name: "سجل النشاط", headers: ["معرّف الحدث", "معرّف العميل", "البريد الإلكتروني", "النشاط", "معرّف المنتج", "المنتج", "الكمية", "التاريخ"], rows: data.activity.map(row => [row.id, row.user_id, names.get(row.user_id) ?? "", customerEventLabels[row.event] ?? row.event, row.product_id, row.product_id ? products.get(row.product_id) ?? "منتج غير موجود" : "", row.quantity, row.created_at]) },
    { name: "بيانات التصدير", headers: ["البيان", "القيمة"], rows: [["وقت التصدير UTC", data.exportedAt], ["المصدر", "إدارة العملاء — جميع الحسابات والسلة والمفضلة والنشاط المسجل"]] },
  ];
}