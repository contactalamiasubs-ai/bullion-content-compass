import { z } from "zod";
export const customerActionSchema = z.object({
  action: z.enum(["read", "merge", "favorite", "add", "quantity", "clear"]),
  productId: z.string().uuid().optional(),
  quantity: z.number().int().min(0).max(999).optional(),
});
export const customerEventLabels: Record<string, string> = {
  product_viewed: "مشاهدة منتج", favorite_added: "إضافة للمفضلة", favorite_removed: "إزالة من المفضلة",
  cart_added: "إضافة للسلة", cart_removed: "إزالة من السلة", cart_quantity: "تغيير الكمية",
  cart_cleared: "تفريغ السلة", guest_merged: "نقل اختيارات الزائر للحساب",
};