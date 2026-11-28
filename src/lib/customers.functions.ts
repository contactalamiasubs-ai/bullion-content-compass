import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { summarizeCustomers } from "@/lib/customer-analytics";


type Inspect = { profiles: any[]; count: number; shopping: any; activity: any[]; activityCount: number };
type Exported = { profiles: any[]; shopping: any[]; activity: any[]; products: { id: string; name_ar: string }[]; exportedAt: string };

export const inspectCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ page: z.number().int().min(1), search: z.string().max(255), userId: z.string().uuid().optional(), activityPage: z.number().int().min(1).default(1) }))
  .handler(async ({ data, context }) => {
    const { runCustomerCommand } = await import("@/lib/customers.server");
    return (await runCustomerCommand({ action: "inspect", ...data }, context)) as Inspect;
  });

export const exportCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { runCustomerCommand } = await import("@/lib/customers.server");
    return (await runCustomerCommand({ action: "export" }, context)) as Exported;
  });

export const customerAnalytics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]) }))
  .handler(async ({ data, context }) => {
    const { runCustomerCommand } = await import("@/lib/customers.server");
    return (await runCustomerCommand({ action: "analytics", days: data.days }, context)) as ReturnType<typeof summarizeCustomers>;
  });
