ALTER TABLE public.dashboard_access DROP CONSTRAINT valid_dashboard_permissions;
ALTER TABLE public.dashboard_access ADD CONSTRAINT valid_dashboard_permissions CHECK (permissions <@ ARRAY['products','prices','content','settings','messages','media','customers','serials']::text[]);
UPDATE public.dashboard_access SET permissions=array_append(permissions,'serials') WHERE 'products'=ANY(permissions) AND NOT ('serials'=ANY(permissions));
CREATE OR REPLACE FUNCTION public.set_dashboard_access(_user_id uuid, _admin boolean, _permissions text[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
PERFORM pg_advisory_xact_lock(762301);
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مسموح بإدارة المستخدمين'; END IF;
IF _permissions IS NULL OR array_position(_permissions,NULL) IS NOT NULL OR NOT (_permissions <@ ARRAY['products','prices','content','settings','messages','media','customers','serials']::text[]) THEN RAISE EXCEPTION 'صلاحيات غير صحيحة'; END IF;
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id=_user_id) THEN RAISE EXCEPTION 'الحساب غير موجود'; END IF;
IF NOT _admin AND _user_id=auth.uid() THEN RAISE EXCEPTION 'لا يمكنك إلغاء صلاحية المسؤول لحسابك'; END IF;
IF NOT _admin AND public.has_role(_user_id,'admin') AND (SELECT count(*) FROM public.user_roles WHERE role='admin')<=1 THEN RAISE EXCEPTION 'يجب الاحتفاظ بمسؤول واحد على الأقل'; END IF;
IF _admin THEN INSERT INTO public.user_roles(user_id,role) VALUES(_user_id,'admin') ON CONFLICT (user_id,role) DO NOTHING;
ELSE DELETE FROM public.user_roles WHERE user_id=_user_id AND role='admin'; END IF;
INSERT INTO public.dashboard_access(user_id,permissions) VALUES(_user_id,CASE WHEN _admin THEN '{}'::text[] ELSE _permissions END) ON CONFLICT(user_id) DO UPDATE SET permissions=excluded.permissions;
END; $$;
REVOKE ALL ON FUNCTION public.set_dashboard_access(uuid,boolean,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_dashboard_access(uuid,boolean,text[]) TO authenticated;
ALTER POLICY serial_product_management ON public.bullion_serials USING(public.has_dashboard_permission(auth.uid(),'serials')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'serials'));
ALTER POLICY "customer profile read" ON public.profiles USING(id=auth.uid() OR public.has_dashboard_permission(auth.uid(),'customers'));
ALTER POLICY "customer shopping read" ON public.customer_shopping USING(user_id=auth.uid() OR public.has_dashboard_permission(auth.uid(),'customers'));
ALTER POLICY "customer activity read" ON public.customer_activity USING(user_id=auth.uid() OR public.has_dashboard_permission(auth.uid(),'customers'));
