CREATE TABLE public.dashboard_access (user_id uuid PRIMARY KEY, permissions text[] NOT NULL DEFAULT '{}', CONSTRAINT valid_dashboard_permissions CHECK (permissions <@ ARRAY['products','prices','content','settings','messages','media']::text[]));
GRANT SELECT ON public.dashboard_access TO authenticated;
GRANT ALL ON public.dashboard_access TO service_role;
ALTER TABLE public.dashboard_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own dashboard access" ON public.dashboard_access FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE FUNCTION public.has_dashboard_permission(_user_id uuid, _permission text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT public.has_role(_user_id,'admin') OR EXISTS (SELECT 1 FROM public.dashboard_access WHERE user_id=_user_id AND _permission=ANY(permissions)); $$;
REVOKE ALL ON FUNCTION public.has_dashboard_permission(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_dashboard_permission(uuid,text) TO authenticated,service_role;
CREATE FUNCTION public.set_dashboard_access(_user_id uuid, _admin boolean, _permissions text[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
PERFORM pg_advisory_xact_lock(762301);
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'غير مسموح بإدارة المستخدمين'; END IF;
IF _permissions IS NULL OR NOT (_permissions <@ ARRAY['products','prices','content','settings','messages','media']::text[]) THEN RAISE EXCEPTION 'صلاحيات غير صحيحة'; END IF;
IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id=_user_id) THEN RAISE EXCEPTION 'الحساب غير موجود'; END IF;
IF NOT _admin AND _user_id=auth.uid() THEN RAISE EXCEPTION 'لا يمكنك إلغاء صلاحية المسؤول لحسابك'; END IF;
IF NOT _admin AND public.has_role(_user_id,'admin') AND (SELECT count(*) FROM public.user_roles WHERE role='admin')<=1 THEN RAISE EXCEPTION 'يجب الاحتفاظ بمسؤول واحد على الأقل'; END IF;
IF _admin THEN INSERT INTO public.user_roles(user_id,role) VALUES(_user_id,'admin') ON CONFLICT (user_id,role) DO NOTHING;
ELSE DELETE FROM public.user_roles WHERE user_id=_user_id AND role='admin'; END IF;
INSERT INTO public.dashboard_access(user_id,permissions) VALUES(_user_id,CASE WHEN _admin THEN '{}'::text[] ELSE _permissions END) ON CONFLICT(user_id) DO UPDATE SET permissions=excluded.permissions;
END; $$;
REVOKE ALL ON FUNCTION public.set_dashboard_access(uuid,boolean,text[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_dashboard_access(uuid,boolean,text[]) TO authenticated;
CREATE POLICY "team products" ON public.products FOR ALL TO authenticated USING(public.has_dashboard_permission(auth.uid(),'products')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'products'));
CREATE POLICY "team groups" ON public.product_groups FOR ALL TO authenticated USING(public.has_dashboard_permission(auth.uid(),'products')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'products'));
CREATE POLICY "team categories" ON public.product_categories FOR ALL TO authenticated USING(public.has_dashboard_permission(auth.uid(),'products')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'products'));
CREATE POLICY "team prices" ON public.metal_prices FOR ALL TO authenticated USING(public.has_dashboard_permission(auth.uid(),'prices')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'prices'));
CREATE POLICY "team history" ON public.price_history FOR ALL TO authenticated USING(public.has_dashboard_permission(auth.uid(),'prices')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'prices'));
CREATE POLICY "team slides" ON public.slides FOR ALL TO authenticated USING(public.has_dashboard_permission(auth.uid(),'content')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'content'));
CREATE POLICY "team sections" ON public.sections FOR ALL TO authenticated USING(public.has_dashboard_permission(auth.uid(),'content')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'content'));
CREATE POLICY "team services" ON public.services FOR ALL TO authenticated USING(public.has_dashboard_permission(auth.uid(),'content')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'content'));
CREATE POLICY "team posts" ON public.posts FOR ALL TO authenticated USING(public.has_dashboard_permission(auth.uid(),'content')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'content'));
CREATE POLICY "team messages read" ON public.contact_messages FOR SELECT TO authenticated USING(public.has_dashboard_permission(auth.uid(),'messages'));
CREATE POLICY "team messages delete" ON public.contact_messages FOR DELETE TO authenticated USING(public.has_dashboard_permission(auth.uid(),'messages'));
CREATE POLICY "team settings update" ON public.site_settings FOR UPDATE TO authenticated USING(public.has_dashboard_permission(auth.uid(),'settings') OR public.has_dashboard_permission(auth.uid(),'prices')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'settings') OR public.has_dashboard_permission(auth.uid(),'prices'));
CREATE FUNCTION public.guard_team_settings() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE field text; price_fields text[] := ARRAY['gold_usd','silver_usd','gold_gram_18','gold_gram_21','gold_gram_24','silver_gram','price_source_enabled','gold_source_url','silver_source_url'];
BEGIN
IF auth.role()='service_role' OR public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
FOR field IN SELECT key FROM jsonb_each(to_jsonb(NEW)) WHERE value IS DISTINCT FROM to_jsonb(OLD)->key LOOP
IF field='updated_at' THEN CONTINUE; END IF;
IF field=ANY(price_fields) THEN
IF NOT public.has_dashboard_permission(auth.uid(),'prices') THEN RAISE EXCEPTION 'لا تملك صلاحية تعديل الأسعار'; END IF;
ELSE IF NOT public.has_dashboard_permission(auth.uid(),'settings') THEN RAISE EXCEPTION 'لا تملك صلاحية تعديل إعدادات الموقع'; END IF;
END IF;
END LOOP;
RETURN NEW;
END; $$;
CREATE TRIGGER guard_team_settings BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.guard_team_settings();
CREATE POLICY "team audit read" ON public.price_updates FOR SELECT TO authenticated USING(public.has_dashboard_permission(auth.uid(),'prices'));
CREATE POLICY "team audit insert" ON public.price_updates FOR INSERT TO authenticated WITH CHECK(public.has_dashboard_permission(auth.uid(),'prices') AND created_by=auth.uid());
CREATE OR REPLACE FUNCTION public.apply_verified_prices(_update_id uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ DECLARE r public.price_updates; BEGIN
IF NOT public.has_dashboard_permission(auth.uid(),'prices') THEN RAISE EXCEPTION 'Forbidden'; END IF;
SELECT * INTO STRICT r FROM public.price_updates WHERE id=_update_id;
UPDATE public.site_settings SET gold_usd=r.gold_usd,silver_usd=r.silver_usd,updated_at=r.verified_at WHERE id=1;
END; $$;
CREATE POLICY "team media read" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='media' AND public.has_dashboard_permission(auth.uid(),'media'));
CREATE POLICY "team media insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='media' AND public.has_dashboard_permission(auth.uid(),'media'));
CREATE POLICY "team media update" ON storage.objects FOR UPDATE TO authenticated USING(bucket_id='media' AND public.has_dashboard_permission(auth.uid(),'media')) WITH CHECK(bucket_id='media' AND public.has_dashboard_permission(auth.uid(),'media'));
CREATE POLICY "team media delete" ON storage.objects FOR DELETE TO authenticated USING(bucket_id='media' AND public.has_dashboard_permission(auth.uid(),'media'));