import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SeoManager } from "@/components/admin/seo-manager";
export const Route = createFileRoute("/_authenticated/admin_/seo")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "إدارة SEO | جولد سنتر" }, { name: "description", content: "إدارة إعدادات البحث والصفحات والكلمات المفتاحية لجولد سنتر." }, { property: "og:title", content: "إدارة SEO | جولد سنتر" }, { property: "og:description", content: "إدارة البحث وتقارير الموقع." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Page,
});
function Page() {
  const { user } = Route.useRouteContext();
  const allowed = useQuery({ queryKey: ["seo-access",user.id], queryFn: async () => { const result=await supabase.rpc("has_dashboard_permission",{_user_id:user.id,_permission:"seo"}); if(result.error)throw result.error;return result.data; }, staleTime:0 });
  if(allowed.isLoading)return <p className="p-10" role="status">جارٍ التحقق من الصلاحيات…</p>;
  if(allowed.error||!allowed.data)return <p className="p-10 text-destructive" role="alert">لا تملك صلاحية إدارة SEO.</p>;
  return <SeoManager/>;
}