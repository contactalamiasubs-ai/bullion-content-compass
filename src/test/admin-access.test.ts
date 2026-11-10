import { afterEach, describe, expect, it, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { AuthSessionMissingError } from "@supabase/supabase-js";
import { Route } from "@/routes/_authenticated/route";

afterEach(() => vi.restoreAllMocks());

describe("Dashboard login protection", () => {
  it("redirects a signed-out visitor to /auth", async () => {
    vi.spyOn(supabase.auth, "getUser").mockResolvedValue({
      data: { user: null },
      error: new AuthSessionMissingError(),
    });
    const guard = Route.options.beforeLoad;
    if (typeof guard !== "function") throw new Error("Missing login guard");
    await expect(guard({} as never)).rejects.toMatchObject({ options: { to: "/auth" } });
  });
});