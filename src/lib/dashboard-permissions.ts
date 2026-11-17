import { z } from "zod";

export const permissionKeys = ["products", "prices", "content", "settings", "messages", "media", "customers", "serials"] as const;
export type Permission = (typeof permissionKeys)[number];
export const permissionLabels: Record<Permission, string> = {
  products: "المنتجات وأقسامها",
  prices: "الأسعار وسعر الجرام والتوثيق",
  content: "الشرائح والمحتوى والخدمات والمقالات",
  settings: "الإعدادات العامة والنافذة المنبثقة",
  messages: "قراءة الرسائل وحذفها",
  media: "رفع الصور وإدارة الوسائط",
  customers: "إدارة العملاء والتحليلات وتنزيل Excel",
  serials: "افحص سبيكتك — إدارة السيريالات ورفع Excel",
};
export const accessSchema = z.object({
  admin: z.boolean(),
  permissions: z.array(z.enum(permissionKeys)).max(permissionKeys.length),
});
export const inviteSchema = accessSchema.extend({ email: z.string().trim().email().max(255) });
export const updateAccessSchema = accessSchema.extend({ userId: z.string().uuid() });
export const deleteAccountSchema = z.object({ userId: z.string().uuid() });
export type DashboardAccess = { admin: boolean; permissions: string[] };

const tabPermissions: Record<string, Permission> = {
  products: "products", "product-groups": "products", "product-categories": "products", serials: "serials", customers: "customers",
  prices: "prices", "gram-rates": "prices", source: "prices", history: "prices",
  sections: "content", catalog: "content", services: "content", posts: "content", slides: "content",
  settings: "settings", popup: "settings", messages: "messages",
};
export function canAccessTab(access: DashboardAccess, tab: string) {
  if (access.admin) return true;
  if (tab === "overview") return access.permissions.length > 0;
  const permission = tabPermissions[tab];
  return permission !== undefined && access.permissions.includes(permission);
}
export function assertCanChangeAccess(actorId: string, targetId: string, admin: boolean) {
  if (actorId === targetId && !admin) throw new Error("لا يمكنك إلغاء صلاحية المسؤول لحسابك");
}
export function assertCanDeleteAccount(actorId: string, targetId: string, targetAdmin: boolean, adminCount: number) {
  if (actorId === targetId) throw new Error("لا يمكنك حذف حسابك الحالي");
  if (targetAdmin && adminCount <= 1) throw new Error("يجب الاحتفاظ بمسؤول واحد على الأقل");
}