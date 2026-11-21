import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminBridgeUrl, AdminBridgeError, adminCommandSchema, forwardAdminCommand, invitationRedirect } from "@/lib/admin-bridge";
import { authenticateAdminRequest, createAdminBridgeHandler, executeAdminCommand, type AdminContext } from "@/lib/admin-users.server";

const mocks = vi.hoisted(() => ({ list: vi.fn(), invite: vi.fn(), remove: vi.fn(), getUser: vi.fn(), createClient: vi.fn() }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { auth: { admin: { listUsers: mocks.list, inviteUserByEmail: mocks.invite, deleteUser: mocks.remove } } } }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
const actor = "3d2278eb-d79e-4a4d-a92c-e43ae288dfe5";
const other = "90e8d54a-f9bb-4430-9015-a036fa6a3ea2";
function context(allowed = true, admins = [{ user_id: actor }]) {
  const rpc = vi.fn().mockResolvedValue({ data: allowed, error: null });
  const query = { in: vi.fn().mockResolvedValue({ data: [], error: null }), eq: vi.fn().mockResolvedValue({ data: admins, error: null }) };
  const supabase = { rpc, from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue(query) }) };
  return { ctx: { userId: actor, supabase } as unknown as AdminContext, rpc, query };
}
function request(body: unknown, auth = "Bearer test-session") {
  return new Request("https://bullion-content-compass.lovable.app/api/public/dashboard-users", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: auth }, body: JSON.stringify(body),
  });
}
beforeEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });

describe("Hostinger authenticated administration bridge", () => {
  it("only forwards the signed-in admin bearer to the exact published endpoint", async () => {
    const send = vi.fn().mockResolvedValue(Response.json({ data: { users: [], hasNext: false } }));
    expect(await forwardAdminCommand(adminBridgeUrl, "Bearer admin-session", { action: "list", page: 1 }, send)).toEqual({ users: [], hasNext: false });
    expect(send).toHaveBeenCalledWith(adminBridgeUrl, expect.objectContaining({ method: "POST", redirect: "error", headers: expect.objectContaining({ Authorization: "Bearer admin-session" }), body: '{"action":"list","page":1}' }));
  });
  it.each(["https://attacker.example/api/public/dashboard-users", `${adminBridgeUrl}?redirect=1`, "http://bullion-content-compass.lovable.app/api/public/dashboard-users"])("does not send credentials to an unapproved endpoint %s", async (url) => {
    const send = vi.fn();
    await expect(forwardAdminCommand(url, "Bearer admin-session", { action: "list", page: 1 }, send)).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
  it("does not forward without a session", async () => {
    const send = vi.fn();
    await expect(forwardAdminCommand(adminBridgeUrl, null, { action: "list", page: 1 }, send)).rejects.toMatchObject({ status: 401 });
    expect(send).not.toHaveBeenCalled();
  });
  it("surfaces remote failures without returning an apparent success", async () => {
    const send = vi.fn().mockResolvedValue(Response.json({ error: "غير مسموح بإدارة المستخدمين." }, { status: 403 }));
    await expect(forwardAdminCommand(adminBridgeUrl, "Bearer admin-session", { action: "list", page: 1 }, send)).rejects.toMatchObject({ status: 403 });
  });
  it("reports an unpublished endpoint or HTML response", async () => {
    const send = vi.fn().mockResolvedValue(new Response("<html>Not found</html>", { status: 404 }));
    await expect(forwardAdminCommand(adminBridgeUrl, "Bearer admin-session", { action: "list", page: 1 }, send)).rejects.toMatchObject({ status: 502 });
  });
  it("keeps Hostinger invitations on the approved customer domain", () => {
    expect(invitationRedirect("https://goldcenterstr.com")).toBe("https://goldcenterstr.com/set-password");
    expect(invitationRedirect("https://www.goldcenterstr.com")).toBe("https://www.goldcenterstr.com/set-password");
  });
  it.each(["https://attacker.example", "https://goldcenterstr.com.attacker.example", "http://goldcenterstr.com", "https://goldcenterstr.com/path", "https://goldcenterstr.com@attacker.example"])("rejects unsafe invitation origins %s", (origin) => {
    expect(() => invitationRedirect(origin)).toThrow();
  });
  it("supports a deliberately configured additional HTTPS domain", () => {
    expect(invitationRedirect("https://shop.example.com", "https://shop.example.com")).toBe("https://shop.example.com/set-password");
  });
  it("rejects requests without authentication before execution", async () => {
    const execute = vi.fn();
    const handler = createAdminBridgeHandler({ authenticate: authenticateAdminRequest, execute });
    const result = await handler(request({ action: "list", page: 1 }, ""));
    expect(result.status).toBe(401);
    expect(execute).not.toHaveBeenCalled();
  });
  it("verifies the caller session with the account service", async () => {
    vi.stubEnv("SUPABASE_URL", "https://auth.example.com");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("Invalid session") });
    mocks.createClient.mockReturnValue({ auth: { getUser: mocks.getUser } });
    await expect(authenticateAdminRequest(request({ action: "list", page: 1 }))).rejects.toMatchObject({ status: 401 });
    expect(mocks.getUser).toHaveBeenCalledWith("test-session");
  });
  it.each(["list", "invite", "delete"] as const)("denies %s to a non-admin before privileged operations", async (action) => {
    const command = action === "list" ? { action, page: 1 } : action === "delete" ? { action, userId: other } : { action, email: "member@example.com", admin: false, permissions: [], redirectOrigin: "https://goldcenterstr.com" };
    await expect(executeAdminCommand(adminCommandSchema.parse(command), context(false).ctx)).rejects.toMatchObject({ status: 403 });
    expect(mocks.list).not.toHaveBeenCalled(); expect(mocks.invite).not.toHaveBeenCalled(); expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("lists only the approved projection, never tokens or account metadata", async () => {
    mocks.list.mockResolvedValue({ data: { users: [{ id: actor, email: "member@example.com", email_confirmed_at: "2026-11-21", user_metadata: { private: "hidden" } }] }, error: null });
    const result = await executeAdminCommand({ action: "list", page: 1 }, context().ctx);
    expect(result).toEqual({ users: [{ id: actor, email: "member@example.com", confirmed: true, admin: false, permissions: [] }], hasNext: false });
    expect(mocks.list).toHaveBeenCalledWith({ page: 1, perPage: 20 });
  });
  it("invites with a Hostinger callback and saves scoped access", async () => {
    mocks.invite.mockResolvedValue({ data: { user: { id: other } }, error: null });
    const { ctx, rpc } = context();
    expect(await executeAdminCommand({ action: "invite", email: "member@example.com", admin: false, permissions: ["serials"], redirectOrigin: "https://goldcenterstr.com" }, ctx)).toEqual({ success: true });
    expect(mocks.invite).toHaveBeenCalledWith("member@example.com", { redirectTo: "https://goldcenterstr.com/set-password" });
    expect(rpc).toHaveBeenCalledWith("set_dashboard_access", { _user_id: other, _admin: false, _permissions: ["serials"] });
  });
  it("preserves the same-site preview invitation callback without enabling remote origin bypass", async () => {
    mocks.invite.mockResolvedValue({ data: { user: { id: other } }, error: null });
    await executeAdminCommand({ action: "invite", email: "member@example.com", admin: false, permissions: [], redirectOrigin: "http://localhost:8080" }, context().ctx, "http://localhost:8080/set-password");
    expect(mocks.invite).toHaveBeenCalledWith("member@example.com", { redirectTo: "http://localhost:8080/set-password" });
    expect(adminCommandSchema.safeParse({ action: "invite", email: "member@example.com", admin: false, permissions: [], redirectOrigin: "http://localhost:8080", localInvitationRedirect: "http://localhost:8080/set-password" }).success).toBe(false);
  });
  it("retains self-deletion protection", async () => {
    await expect(executeAdminCommand({ action: "delete", userId: actor }, context().ctx)).rejects.toThrow("لا يمكنك حذف حسابك الحالي");
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("retains final-admin protection", async () => {
    await expect(executeAdminCommand({ action: "delete", userId: other }, context(true, [{ user_id: other }]).ctx)).rejects.toThrow("يجب الاحتفاظ بمسؤول واحد على الأقل");
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("deletes another account only after full-admin authorization", async () => {
    mocks.remove.mockResolvedValue({ error: null });
    expect(await executeAdminCommand({ action: "delete", userId: other }, context().ctx)).toEqual({ success: true });
    expect(mocks.remove).toHaveBeenCalledWith(other);
  });
  it("returns private no-store JSON for an authenticated request", async () => {
    const handler = createAdminBridgeHandler({ authenticate: vi.fn().mockResolvedValue(context().ctx), execute: vi.fn().mockResolvedValue({ users: [], hasNext: false }) });
    const result = await handler(request({ action: "list", page: 1 }));
    expect(result.status).toBe(200); expect(result.headers.get("Cache-Control")).toBe("no-store");
    expect(result.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(await result.json()).toEqual({ data: { users: [], hasNext: false } });
  });
  it("does not execute unsupported or invalid payloads", async () => {
    const execute = vi.fn();
    const handler = createAdminBridgeHandler({ authenticate: vi.fn().mockResolvedValue(context().ctx), execute });
    expect((await handler(request({ action: "delete", userId: "invalid" }))).status).toBe(400);
    expect((await handler(request({ action: "list", page: 0 }))).status).toBe(400);
    expect(execute).not.toHaveBeenCalled();
  });
  it("never exposes unexpected internal failures", async () => {
    const handler = createAdminBridgeHandler({ authenticate: vi.fn().mockRejectedValue(new Error("secret value")), execute: vi.fn() });
    const result = await handler(request({ action: "list", page: 1 }));
    expect(result.status).toBe(500); expect(await result.text()).not.toContain("secret value");
  });
});