import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, UsersRound } from "lucide-react";
import { Customers } from "@/components/admin/customers";
import { Button } from "@/components/ui/button";
import { settingsQuery } from "@/lib/data";
import { pick } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin_/customers")({
  head: () => ({ meta: [
    { title: "إدارة العملاء | جولد سنتر" },
    { name: "description", content: "إدارة حسابات العملاء ومراجعة السلة والمفضلة وسجل النشاط." },
    { property: "og:title", content: "إدارة العملاء | جولد سنتر" },
    { property: "og:description", content: "صفحة إدارة عملاء جولد سنتر داخل لوحة التحكم." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: CustomerManagement,
});

function CustomerManagement() {
  const { user } = Route.useRouteContext();
  const { data: settings } = useQuery(settingsQuery);
  const access = useQuery({
    queryKey: ["customer-management-access", user.id],
    queryFn: async () => {
      const result = await supabase.rpc("has_dashboard_permission", { _user_id: user.id, _permission: "customers" });
      if (result.error) throw new Error("تعذر التحقق من صلاحيات الحساب");
      return result.data;
    },
    staleTime: 0,
    refetchInterval: 30000,
  });
  return <main dir="rtl" className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-8">
    <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
      <div><p className="mb-2 text-sm text-gold">لوحة تحكم {pick(settings, "site_name", "ar")}</p>
        <h1 className="flex items-center gap-3 text-2xl"><UsersRound className="text-gold" />إدارة العملاء</h1></div>
      <Button asChild variant="outline"><Link to="/admin"><LayoutDashboard />لوحة التحكم</Link></Button>
    </header>
    {access.isPending ? <p role="status">جارٍ التحقق من الصلاحيات…</p> : access.error ? <p role="alert">{access.error.message}</p> : access.data ? <Customers /> : <p role="alert">هذا الحساب ليس له صلاحية إدارة العملاء.</p>}
  </main>;
}