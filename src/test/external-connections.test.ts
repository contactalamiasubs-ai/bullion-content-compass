import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ middleware: () => ({ handler: (handler: unknown) => handler }) }) }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
import { externalConnectionsStatus } from "@/lib/external-connections.functions";
type Context = { userId: string; supabase: { rpc: ReturnType<typeof vi.fn> } };
const run = externalConnectionsStatus as unknown as (input: { context: Context }) => Promise<unknown>;
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("External connection status protection", () => {
  it("denies a non-admin before checking any external service", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });
    await expect(run({ context: { userId: "customer", supabase: { rpc } } })).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("has_role", { _user_id: "customer", _role: "admin" });
  });
  it("returns only capability flags, never credentials or the provider record", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.test");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-publishable");
    vi.stubEnv("LOVABLE_API_KEY", "test-private-value");
    vi.stubEnv("HOSTED_ADMIN_BRIDGE_URL", "https://example.test/bridge");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ external: { google: true }, private_field: "not-for-client" })));
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    expect(await run({ context: { userId: "admin", supabase: { rpc } } })).toEqual({ googleEnabled: true, aiConfigured: true, hostedBridgeConfigured: true });
  });
});