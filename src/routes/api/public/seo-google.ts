import { createFileRoute } from "@tanstack/react-router";
import { seoGoogleCommand } from "@/lib/seo-google-bridge";
import { AdminBridgeError } from "@/lib/admin-bridge";
export const Route = createFileRoute("/api/public/seo-google")({
  staticData: { sitemap: false },
  server: { handlers: { POST: async ({ request }) => {
    const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
    try {
      const { authenticateAdminRequest } = await import("@/lib/admin-users.server");
      const { executeGoogleCommand, assertSeoPermission } = await import("@/lib/seo-google-actions.server");
      const context = await authenticateAdminRequest(request); await assertSeoPermission(context);
      if (!request.headers.get("content-type")?.startsWith("application/json")) throw new AdminBridgeError("صيغة الطلب غير صحيحة.",400);
      const raw = await request.text(); if (raw.length>4096) throw new AdminBridgeError("حجم الطلب غير مسموح.",413);
      const parsed = seoGoogleCommand.safeParse(JSON.parse(raw));
      if (!parsed.success) throw new AdminBridgeError("بيانات الطلب غير صحيحة.",400);
      return Response.json({ data: await executeGoogleCommand(parsed.data,context) }, { headers });
    } catch (error) {
      if (error instanceof AdminBridgeError) return Response.json({ error: error.message }, {status:error.status,headers});
      const safe = error instanceof Error && error.message.startsWith("Google [") ? error.message : "تعذر تنفيذ طلب Google؛ تحقق من الاتصال ثم أعد المحاولة.";
      return Response.json({error:safe},{status:502,headers});
    }
  } } },
});