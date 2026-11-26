import { z } from "zod";

export const serialSchema = z.string().trim().transform(value => value.toUpperCase()).pipe(z.string().regex(/^[A-Z0-9./-]{1,100}$/, "السيريال يجب أن يحتوي على حروف إنجليزية وأرقام فقط أو - / ."));
export const customerNumberSchema = z.string().trim().transform(value => value.toUpperCase()).pipe(z.string().regex(/^[A-Z0-9 ._/-]{2,40}$/, "رقم العميل يجب أن يكون بين حرفين و40 حرفًا: حروف إنجليزية وأرقام أو - / ."));
export const bullionRowSchema = z.object({
  serial: serialSchema,
  name_ar: z.string().trim().min(1).max(300),
  name_en: z.string().trim().max(300).default(""),
  weight_grams: z.coerce.number().positive().max(1000000),
  purity: z.string().trim().min(1).max(100),
  specifications_ar: z.string().max(5000).default(""),
  specifications_en: z.string().max(5000).default(""),
  active: z.boolean().default(true),
});
export type BullionRow = z.infer<typeof bullionRowSchema>;
export const bullionHeaders = ["السيريال", "اسم السبيكة", "الاسم بالإنجليزية", "الوزن بالجرام", "العيار / النقاء", "المواصفات", "المواصفات بالإنجليزية"];
export function parseBullionRows(rows: unknown[][]): BullionRow[] {
  const headers = rows[0]?.map(value => String(value ?? "").trim()) ?? [];
  const columns = bullionHeaders.map(header => headers.indexOf(header));
  if ([0, 1, 3, 4].some(index => (columns[index] ?? -1) < 0)) throw new Error("الأعمدة المطلوبة: السيريال، اسم السبيكة، الوزن بالجرام، العيار / النقاء");
  const seen = new Set<string>();
  const parsed: BullionRow[] = [];
  rows.slice(1).forEach((row, index) => {
    if (row.every(cell => cell == null || cell === "")) return;
    const value = (i: number) => row[columns[i] ?? -1] ?? "";
    if (typeof value(0) !== "string") throw new Error(`الصف ${index + 2}: احفظ السيريال كنص للحفاظ على الأصفار`);
    const result = bullionRowSchema.safeParse({ serial: value(0), name_ar: value(1), name_en: value(2), weight_grams: value(3), purity: String(value(4)), specifications_ar: value(5), specifications_en: value(6) });
    if (!result.success) throw new Error(`الصف ${index + 2}: بيانات السبيكة غير مكتملة أو غير صحيحة`);
    if (seen.has(result.data.serial)) throw new Error(`الصف ${index + 2}: السيريال مكرر في الملف`);
    seen.add(result.data.serial); parsed.push(result.data);
  });
  if (!parsed.length) throw new Error("الملف لا يحتوي على سيريالات");
  if (parsed.length > 1000) throw new Error("الحد الأقصى 1000 سيريال لكل ملف");
  return parsed;
}