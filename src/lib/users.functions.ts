import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCanChangeAccess, assertCanDeleteAccount, deleteAccountSchema, inviteSchema, updateAccessSchema } from "./dashboard-permissions";
import { adminListSchema, adminSuccessSchema, forwardAdminCommand } from "./admin-bridge";

export const listDashboardUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ page: z.number().int().min(1).max(10000) }))
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !allowed) throw new Error("غير مسموح بإدارة المستخدمين");
    const command = { action: "list" as const, page: data.page };
    const bridge = process.env["HOSTED_ADMIN_BRIDGE_URL"];
    if (bridge) {
      const { getRequest } = await import("@tanstack/react-start/server");
      return adminListSchema.parse(await forwardAdminCommand(bridge, getRequest().headers.get("authorization"), command));
    }
    const { executeAdminCommand } = await import("./admin-users.server");
    return adminListSchema.parse(await executeAdminCommand(command, context));
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
    const command = { action: "delete" as const, userId: data.userId };
    const bridge = process.env["HOSTED_ADMIN_BRIDGE_URL"];
    if (bridge) {
      const { getRequest } = await import("@tanstack/react-start/server");
      return adminSuccessSchema.parse(await forwardAdminCommand(bridge, getRequest().headers.get("authorization"), command));
    }
    const { executeAdminCommand } = await import("./admin-users.server");
    return adminSuccessSchema.parse(await executeAdminCommand(command, context));
  });

export const inviteDashboardUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(inviteSchema)
  .handler(async ({ data, context }) => {
    const { data: allowed, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error || !allowed) throw new Error("غير مسموح بإضافة المستخدمين");
    const { getRequestUrl } = await import("@tanstack/react-start/server");
    const origin = getRequestUrl().origin;
    const command = { ...data, action: "invite" as const, redirectOrigin: origin };
    const bridge = process.env["HOSTED_ADMIN_BRIDGE_URL"];
    if (bridge) {
      const { getRequest } = await import("@tanstack/react-start/server");
      return adminSuccessSchema.parse(await forwardAdminCommand(bridge, getRequest().headers.get("authorization"), command));
    }
    // Same-site preview invitations keep their existing redirect; remote invitations use the strict allowlist.
    const { executeAdminCommand } = await import("./admin-users.server");
    return adminSuccessSchema.parse(await executeAdminCommand(command, context, new URL("/set-password", origin).href));
  });