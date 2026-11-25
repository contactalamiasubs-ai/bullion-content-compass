import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX = 15 * 1024 * 1024;
const ALLOWED = /^(image\/(png|jpe?g|webp|gif|svg\+xml|avif)|application\/pdf)$/;

async function staff(context: { supabase: { rpc: (f: never, a: never) => PromiseLike<{ data: unknown; error: unknown }> }; userId: string }) {
  for (const p of ["content", "products", "settings", "serials", "prices"]) {
    const r = await context.supabase.rpc("has_dashboard_permission" as never, { _user_id: context.userId, _permission: p } as never);
    if (!r.error && r.data === true) return;
  }
  throw new Error("لا تملك صلاحية رفع الملفات");
}

/** Uploads an image/PDF into the Hostinger database (media_files). */
export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => {
    if (!(d instanceof FormData)) throw new Error("ملف غير صالح");
    const file = d.get("file");
    if (!(file instanceof File) || !file.size || file.size > MAX || !ALLOWED.test(file.type)) throw new Error("الملف يجب أن يكون صورة أو PDF بحجم أقل من 15 ميجابايت");
    return file;
  })
  .handler(async ({ data: file, context }) => {
    await staff(context as never);
    const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_").replace(/^\.+/, "").slice(-120) || "file"}`;
    const { exec } = await import("./mysql.server");
    await exec("INSERT INTO media_files (path, mime, data, created_at) VALUES (?,?,?,UTC_TIMESTAMP(3))", [path, file.type, Buffer.from(await file.arrayBuffer())]);
    return { path };
  });

/** Staff preview of unsaved uploads (drafts stay private). */
export const previewMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ path: z.string().regex(/^[\w.-]{1,200}$/) }).parse(d))
  .handler(async ({ data, context }) => {
    await staff(context as never);
    const { sql } = await import("./mysql.server");
    const [row] = await sql<{ mime: string; data: Buffer }>("SELECT mime, data FROM media_files WHERE path = ?", [data.path]);
    if (row) return row.mime === "application/pdf" ? null : `data:${row.mime};base64,${Buffer.from(row.data).toString("base64")}`;
    const { data: signed } = await context.supabase.storage.from("media").createSignedUrl(data.path, 3600);
    return signed?.signedUrl ?? null;
  });
