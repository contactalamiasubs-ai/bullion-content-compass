import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { bullionRowSchema } from "@/lib/bullion-serials";
import { SITE_TABLES, cleanRow, isSiteTable, settingsPermissionsFor, type SitePermission, type SiteTable } from "./site-schema";

export type SiteRow = Record<string, string | number | boolean | null>;
type Ctx = { supabase: { rpc: (fn: never, args: never) => PromiseLike<{ data: unknown; error: unknown }> }; userId: string };

async function can(ctx: Ctx, permission: SitePermission) {
  const r = await ctx.supabase.rpc("has_dashboard_permission" as never, { _user_id: ctx.userId, _permission: permission } as never);
  if (!r.error && r.data === true) return true;
  const a = await ctx.supabase.rpc("has_role" as never, { _user_id: ctx.userId, _role: "admin" } as never);
  return !a.error && a.data === true;
}
async function requireAny(ctx: Ctx, perms: SitePermission[]) {
  for (const p of perms) if (await can(ctx, p)) return;
  throw new Error("لا تملك صلاحية تعديل هذا المحتوى");
}

const tableSchema = z.string().refine(isSiteTable, "جدول غير معروف").transform((t) => t as SiteTable);
const listInput = z.object({
  table: tableSchema,
  order: z.string().max(40).optional(),
  ascending: z.boolean().optional(),
  eq: z.record(z.string().max(40), z.union([z.string().max(300), z.number(), z.boolean()])).optional(),
  single: z.boolean().optional(),
});

async function list(input: z.infer<typeof listInput>, staff: boolean) {
  const { sql, ident, normalize, toDb } = await import("./mysql.server");
  const def = SITE_TABLES[input.table];
  if (!staff && def.publicFilter === "none") throw new Error("غير مسموح");
  const where: string[] = [];
  const params: unknown[] = [];
  if (!staff && def.publicFilter) where.push(`${ident(def.publicFilter)} = 1`);
  // Scheduled posts stay hidden from visitors until their publish time.
  if (!staff && input.table === "posts") where.push("(publish_at IS NULL OR publish_at <= UTC_TIMESTAMP(3))");
  for (const [k, v] of Object.entries(input.eq ?? {})) {
    if (!def.columns.includes(k)) throw new Error("حقل غير معروف");
    where.push(`${ident(k)} = ?`);
    params.push(toDb(v));
  }
  const order = input.order && def.columns.includes(input.order) ? input.order : null;
  const rows = await sql(
    `SELECT * FROM ${ident(input.table)}${where.length ? " WHERE " + where.join(" AND ") : ""}${order ? ` ORDER BY ${ident(order)} ${input.ascending === false ? "DESC" : "ASC"}` : ""}${input.single ? " LIMIT 1" : ""}`,
    params,
  );
  return rows.map((r) => normalize(input.table, r));
}

/** Public site reads (hidden products/slides and drafts are filtered out). */
export const readSiteRows = createServerFn({ method: "GET" })
  .inputValidator((d) => listInput.parse(d))
  .handler(async ({ data }) => (await list(data, false)) as SiteRow[]);

/** Dashboard reads, including hidden rows; requires any dashboard permission for that table. */
export const readStaffRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => listInput.parse(d))
  .handler(async ({ data, context }) => {
    await requireAny(context as unknown as Ctx, SITE_TABLES[data.table].write);
    return (await list(data, true)) as SiteRow[];
  });

export const insertSiteRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ table: tableSchema, values: z.record(z.string(), z.unknown()) }).parse(d))
  .handler(async ({ data, context }) => {
    const def = SITE_TABLES[data.table];
    if (data.table === "site_settings") throw new Error("غير مسموح");
    await requireAny(context as unknown as Ctx, def.write);
    const { exec, ident, toDb, nowDb } = await import("./mysql.server");
    const row = cleanRow(data.table, data.values);
    if (def.uuidPk) row[def.pk] = crypto.randomUUID();
    if (def.columns.includes("created_at")) row["created_at"] = nowDb();
    const cols = Object.keys(row);
    await exec(`INSERT INTO ${ident(data.table)} (${cols.map(ident).join(",")}) VALUES (${cols.map(() => "?").join(",")})`, cols.map((c) => toDb(row[c])));
    return { id: String(row[def.pk] ?? "") };
  });

export const updateSiteRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ table: tableSchema, id: z.union([z.string().max(200), z.number()]), patch: z.record(z.string(), z.unknown()) }).parse(d))
  .handler(async ({ data, context }) => {
    const def = SITE_TABLES[data.table];
    const { sql, exec, ident, toDb, nowDb, normalize } = await import("./mysql.server");
    const patch = cleanRow(data.table, data.patch);
    delete patch[def.pk];
    if (data.table === "site_settings") {
      const before = (await sql(`SELECT * FROM site_settings WHERE id = ?`, [data.id]))[0];
      if (!before) throw new Error("غير موجود");
      const needed = settingsPermissionsFor(patch, normalize("site_settings", before));
      for (const p of needed) if (!(await can(context as unknown as Ctx, p))) throw new Error(p === "prices" ? "لا تملك صلاحية تعديل الأسعار" : "لا تملك صلاحية تعديل إعدادات الموقع");
      patch["updated_at"] = nowDb();
    } else {
      await requireAny(context as unknown as Ctx, def.write);
      if (data.table === "bullion_serials") Object.assign(patch, bullionRowSchema.partial().parse(patch));
    }
    if (data.table === "metal_prices") patch["updated_at"] = nowDb();
    const cols = Object.keys(patch);
    if (!cols.length) return { updated: 1 };
    const res = await exec(`UPDATE ${ident(data.table)} SET ${cols.map((c) => `${ident(c)} = ?`).join(", ")} WHERE ${ident(def.pk)} = ?`, [...cols.map((c) => toDb(patch[c])), data.id]);
    if (!res.affectedRows) throw new Error("لم يتم الحفظ: العنصر غير موجود");
    return { updated: res.affectedRows };
  });

export const deleteSiteRow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ table: tableSchema, id: z.string().max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const def = SITE_TABLES[data.table];
    if (data.table === "site_settings") throw new Error("غير مسموح");
    await requireAny(context as unknown as Ctx, def.write);
    const { sql, exec, ident } = await import("./mysql.server");
    // Linked categories/groups cannot be deleted (keeps products categorised).
    if (data.table === "product_categories" && (await sql(`SELECT 1 FROM products WHERE category_id = ? LIMIT 1`, [data.id])).length) throw new Error("لا يمكن حذف فئة مرتبطة بمنتجات");
    if (data.table === "product_groups" && (await sql(`SELECT 1 FROM product_categories WHERE group_id = ? LIMIT 1`, [data.id])).length) throw new Error("لا يمكن حذف قسم مرتبط بفئات");
    const res = await exec(`DELETE FROM ${ident(data.table)} WHERE ${ident(def.pk)} = ?`, [data.id]);
    if (!res.affectedRows) throw new Error("لم يتم الحذف: العنصر غير موجود");
    return { deleted: res.affectedRows };
  });

export const countSiteRows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAny(context as unknown as Ctx, ["content", "products"]);
    const { sql } = await import("./mysql.server");
    const [r] = await sql<{ p: number; s: number; b: number }>(`SELECT (SELECT COUNT(*) FROM products) p, (SELECT COUNT(*) FROM slides) s, (SELECT COUNT(*) FROM posts) b`);
    return { products: Number(r?.p ?? 0), slides: Number(r?.s ?? 0), posts: Number(r?.b ?? 0) };
  });

export const latestVerifiedPrice = createServerFn({ method: "GET" }).handler(async () => {
  const { sql } = await import("./mysql.server");
  const rows = await sql(`SELECT id, gold_usd, silver_usd, gold_source_url, silver_source_url, gold_source_at, silver_source_at, verified_at, summary_ar, summary_en FROM price_updates ORDER BY verified_at DESC LIMIT 1`);
  return rows.map((r) => ({ ...r, gold_source_at: String(r["gold_source_at"]).replace(" ", "T") + "Z", silver_source_at: String(r["silver_source_at"]).replace(" ", "T") + "Z", verified_at: String(r["verified_at"]).replace(" ", "T") + "Z" })) as {
    id: string; gold_usd: number; silver_usd: number; gold_source_url: string; silver_source_url: string;
    gold_source_at: string; silver_source_at: string; verified_at: string; summary_ar: string; summary_en: string;
  }[];
});

export const lookupBullionSerial = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ serial: z.string().trim().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { sql } = await import("./mysql.server");
    const rows = await sql(`SELECT serial, name_ar, name_en, weight_grams, purity, specifications_ar, specifications_en FROM bullion_serials WHERE active = 1 AND serial = ? LIMIT 1`, [data.serial.toUpperCase()]);
    return rows as { serial: string; name_ar: string; name_en: string; weight_grams: number; purity: string; specifications_ar: string; specifications_en: string }[];
  });

export const productNames = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { sql } = await import("./mysql.server");
    return (await sql(`SELECT id, name_ar FROM products ORDER BY id`)) as { id: string; name_ar: string }[];
  });

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().min(3).max(255).regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/),
  phone: z.string().trim().max(30).nullable().optional(),
  message: z.string().trim().min(1).max(2000),
});

/** Visitor contact form; stored in the Hostinger database. */
export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d) => contactSchema.parse(d))
  .handler(async ({ data }) => {
    const { exec } = await import("./mysql.server");
    await exec("INSERT INTO contact_messages (id, name, email, phone, message, created_at) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3))", [crypto.randomUUID(), data.name, data.email, data.phone || null, data.message]);
    return { ok: true };
  });

const checkSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().min(5).max(254).regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/),
  customer_number: z.string().trim().min(2).max(40).regex(/^[A-Z0-9 ._/-]+$/i),
  serial: z.string().trim().min(1).max(64),
});

/** Visitor bar-check request; stored in the Hostinger database. */
export const submitBullionCheck = createServerFn({ method: "POST" })
  .inputValidator((d) => checkSchema.parse(d))
  .handler(async ({ data }) => {
    const { exec } = await import("./mysql.server");
    await exec("INSERT INTO bullion_checks (id, name, email, customer_number, serial, created_at) VALUES (?,?,?,?,?,UTC_TIMESTAMP(3))", [crypto.randomUUID(), data.name, data.email.toLowerCase(), data.customer_number, data.serial]);
    return { ok: true };
  });

/** Count of contact messages for the dashboard overview. */
export const countMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAny(context as unknown as Ctx, ["messages"]);
    const { sql } = await import("./mysql.server");
    const [r] = await sql<{ n: number }>("SELECT COUNT(*) n FROM contact_messages");
    return Number(r?.n ?? 0);
  });
