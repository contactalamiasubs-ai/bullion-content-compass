import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { assertCanDeleteAccount } from "./dashboard-permissions";
import { AdminBridgeError, adminCommandSchema, invitationRedirect, type AdminCommand, type AdminResult } from "./admin-bridge";

export type AdminContext = { supabase: SupabaseClient<Database>; userId: string };

export async function authenticateAdminRequest(request: Request): Promise<AdminContext> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ") || !header.slice(7)) throw new AdminBridgeError("يرجى تسجيل الدخول مرة أخرى.", 401);
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new AdminBridgeError("إعدادات إدارة المستخدمين غير مكتملة.", 503);
  const token = header.slice(7);
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: header }, fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new AdminBridgeError("جلسة الدخول غير صالحة؛ سجّل الدخول مرة أخرى.", 401);
  return { supabase, userId: data.user.id };
}

export async function executeAdminCommand(command: AdminCommand, context: AdminContext): Promise<AdminResult> {
  const { data: allowed, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !allowed) throw new AdminBridgeError("غير مسموح بإدارة المستخدمين.", 403);
  // Verify authorization and self-deletion before even loading the privileged client.
  if (command.action === "delete") assertCanDeleteAccount(context.userId, command.userId, false, 0);
  const redirectTo = command.action === "invite" ? invitationRedirect(command.redirectOrigin, process.env["DASHBOARD_INVITE_ORIGINS"] ?? "") : undefined;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  if (command.action === "list") {
    const result = await supabaseAdmin.auth.admin.listUsers({ page: command.page, perPage: 20 });
    if (result.error) throw new AdminBridgeError("تعذر تحميل الحسابات.", 502);
    const ids = result.data.users.map((user) => user.id);
    if (ids.length === 0) return { users: [], hasNext: false };
    const [roles, access] = await Promise.all([
      context.supabase.from("user_roles").select("user_id,role").in("user_id", ids),
      context.supabase.from("dashboard_access").select("user_id,permissions").in("user_id", ids),
    ]);
    if (roles.error || access.error) throw new AdminBridgeError("تعذر تحميل الصلاحيات.", 502);
    return { users: result.data.users.map((user) => ({
      id: user.id, email: user.email ?? "", confirmed: !!user.email_confirmed_at,
      admin: roles.data.some((role) => role.user_id === user.id && role.role === "admin"),
      permissions: access.data.find((row) => row.user_id === user.id)?.permissions ?? [],
    })), hasNext: result.data.users.length === 20 };
  }
  if (command.action === "delete") {
    const { data: admins, error: rolesError } = await context.supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (rolesError) throw new AdminBridgeError("تعذر التحقق من صلاحيات الحساب.", 502);
    assertCanDeleteAccount(context.userId, command.userId, admins.some((row) => row.user_id === command.userId), admins.length);
    // Existing deletion trigger shares the access-change lock, protecting the final admin under concurrency.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(command.userId);
    if (deleteError) throw new AdminBridgeError("تعذر حذف الحساب؛ حدّث القائمة وحاول مرة أخرى. لا يمكن حذف آخر مسؤول.", 400);
    return { success: true };
  }
  if (!redirectTo) throw new AdminBridgeError("رابط الدعوة غير مكتمل.", 400);
  const result = await supabaseAdmin.auth.admin.inviteUserByEmail(command.email, { redirectTo });
  if (result.error || !result.data.user) throw new AdminBridgeError("تعذر إرسال الدعوة؛ تأكد أن البريد صحيح وغير مسجل مسبقًا، أو عدّل صلاحيات الحساب الموجود من القائمة.", 400);
  const { error: accessError } = await context.supabase.rpc("set_dashboard_access", {
    _user_id: result.data.user.id, _admin: command.admin, _permissions: command.permissions,
  });
  if (accessError) throw new AdminBridgeError("تم إرسال الدعوة لكن تعذر حفظ الصلاحيات؛ عدّل الحساب من القائمة.", 400);
  return { success: true };
}

type HandlerDependencies = {
  authenticate: (request: Request) => Promise<AdminContext>;
  execute: (command: AdminCommand, context: AdminContext) => Promise<AdminResult>;
};
export function createAdminBridgeHandler(deps: HandlerDependencies = { authenticate: authenticateAdminRequest, execute: executeAdminCommand }) {
  return async (request: Request) => {
    const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
    try {
      // No browser CORS or cookie-based authorization: only a validated account bearer is accepted.
      const context = await deps.authenticate(request);
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new AdminBridgeError("صيغة الطلب غير صحيحة.", 400);
      const raw = await request.text();
      if (raw.length > 4096) throw new AdminBridgeError("حجم الطلب غير مسموح.", 413);
      let json: unknown;
      try { json = JSON.parse(raw); } catch { throw new AdminBridgeError("بيانات الطلب غير صحيحة.", 400); }
      const parsed = adminCommandSchema.safeParse(json);
      if (!parsed.success) throw new AdminBridgeError("بيانات إدارة المستخدمين غير صحيحة.", 400);
      return Response.json({ data: await deps.execute(parsed.data, context) }, { headers });
    } catch (error) {
      if (error instanceof AdminBridgeError) return Response.json({ error: error.message }, { status: error.status, headers });
      // Guard errors contain safe user-facing copy; unexpected errors must never reveal credentials or internals.
      if (error instanceof Error && ["لا يمكنك حذف حسابك الحالي", "يجب الاحتفاظ بمسؤول واحد على الأقل"].includes(error.message)) {
        return Response.json({ error: error.message }, { status: 400, headers });
      }
      return Response.json({ error: "تعذر تنفيذ العملية في إدارة المستخدمين." }, { status: 500, headers });
    }
  };
}