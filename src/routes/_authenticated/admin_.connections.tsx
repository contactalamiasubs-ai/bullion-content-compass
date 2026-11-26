import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExternalConnections } from "@/components/admin/external-connections";

export const Route = createFileRoute("/_authenticated/admin_/connections")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "الاتصالات الخارجية | جولد سنتر" },
    { name: "description", content: "إدارة اتصالات Google والأسعار وقنوات التواصل في جولد سنتر." },
    { property: "og:title", content: "الاتصالات الخارجية | جولد سنتر" },
    { property: "og:description", content: "إدارة خدمات الموقع الخارجية بأمان." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: Page,
});
function Page() {
  const { user } = Route.useRouteContext();
  const allowed = useQuery({ queryKey: ["connections-access", user.id], staleTime: 0, queryFn: async () => {
    const result = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (result.error) throw result.error;
    return result.data;
  } });
  if (allowed.isPending) return <p className="p-10" role="status">جارٍ التحقق من الصلاحيات…</p>;
  if (allowed.error || !allowed.data) return <p className="p-10 text-destructive" role="alert">الاتصالات الخارجية متاحة للمسؤول الكامل فقط.</p>;
  return <ExternalConnections />;
}