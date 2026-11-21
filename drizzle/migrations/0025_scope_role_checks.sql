CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ select (_user_id = auth.uid() or auth.role()='service_role' or exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin'))
 and exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $function$;
CREATE OR REPLACE FUNCTION public.has_dashboard_permission(_user_id uuid, _permission text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$ SELECT (_user_id = auth.uid() or auth.role()='service_role' or exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin'))
 and (exists(select 1 from public.user_roles where user_id=_user_id and role='admin') OR EXISTS (SELECT 1 FROM public.dashboard_access WHERE user_id=_user_id AND _permission=ANY(permissions))) $function$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_dashboard_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_dashboard_permission(uuid, text) TO authenticated, service_role;