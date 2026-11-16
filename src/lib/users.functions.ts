import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCanChangeAccess, assertCanDeleteAccount, deleteAccountSchema, inviteSchema, updateAccessSchema } from "./dashboard-permissions";

export const listDashboardUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ page: z.number().int().min(1).max(10000) }))
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !allowed) throw new Error("غير مسموح بإدارة المستخدمين");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.auth.admin.listUsers({ page: data.page, perPage: 20 });
    if (result.error) throw new Error("تعذر تحميل الحسابات");
    const ids = result.data.users.map((user) => user.id);
    const [roles, access] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids),
      supabaseAdmin.from("dashboard_access").select("user_id,permissions").in("user_id", ids),
    ]);
    if (roles.error || access.error) throw new Error("تعذر تحميل الصلاحيات");
    return {
      users: result.data.users.map((user) => ({
        id: user.id, email: user.email ?? "", confirmed: !!user.email_confirmed_at,
        admin: roles.data.some((role) => role.user_id === user.id && role.role === "admin"),
        permissions: access.data.find((row) => row.user_id === user.id)?.permissions ?? [],
      })),
      hasNext: result.data.users.length === 20,
    };
  });

export const updateDashboardAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(updateAccessSchema)
  .handler(async ({ data, context }) => {
    assertCanChangeAccess(context.userId, data.userId, data.admin);
    // The atomic database operation authorizes the caller and protects the final admin.
    const { error } = await context.supabase.rpc("set_dashboard_access", {
      _user_id: data.userId, _admin: data.admin, _permissions: data.permissions,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteDashboardUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(deleteAccountSchema)
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !allowed) throw new Error("غير مسموح بحذف المستخدمين");
    assertCanDeleteAccount(context.userId, data.userId, false, 0);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: admins, error: rolesError } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin");
    if (rolesError) throw new Error("تعذر التحقق من صلاحيات الحساب");
    assertCanDeleteAccount(context.userId, data.userId, admins.some((row) => row.user_id === data.userId), admins.length);
    // The database trigger locks against concurrent access changes and final-admin deletion.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (deleteError) throw new Error("تعذر حذف الحساب؛ حدّث القائمة وحاول مرة أخرى. لا يمكن حذف آخر مسؤول.");
    return { success: true };
  });

export const inviteDashboardUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(inviteSchema)
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !allowed) throw new Error("غير مسموح بإضافة المستخدمين");
    const { getRequestUrl } = await import("@tanstack/react-start/server");
    const redirectTo = new URL("/set-password", getRequestUrl().origin).href;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { redirectTo });
    if (result.error || !result.data.user) throw new Error("تعذر إرسال الدعوة؛ تأكد أن البريد صحيح وغير مسجل مسبقًا، أو عدّل صلاحيات الحساب الموجود من القائمة.");
    const { error: accessError } = await context.supabase.rpc("set_dashboard_access", {
      _user_id: result.data.user.id, _admin: data.admin, _permissions: data.permissions,
    });
    if (accessError) throw new Error("تم إرسال الدعوة لكن تعذر حفظ الصلاحيات؛ عدّل الحساب من القائمة.");
    return { success: true };
  });