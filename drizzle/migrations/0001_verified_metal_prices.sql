ALTER TABLE public.site_settings ADD COLUMN price_source_enabled boolean NOT NULL DEFAULT false, ADD COLUMN gold_source_url text NOT NULL DEFAULT 'https://api.gold-api.com/price/XAU', ADD COLUMN silver_source_url text NOT NULL DEFAULT 'https://api.gold-api.com/price/XAG';
CREATE TABLE public.price_updates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), gold_usd numeric NOT NULL, silver_usd numeric NOT NULL, gold_source_url text NOT NULL, silver_source_url text NOT NULL, gold_source_at timestamptz NOT NULL, silver_source_at timestamptz NOT NULL, verified_at timestamptz NOT NULL DEFAULT now(), model text NOT NULL, summary_ar text NOT NULL, summary_en text NOT NULL, source_payload jsonb NOT NULL, response_id text NOT NULL, created_by uuid NOT NULL);
GRANT SELECT ON public.price_updates TO anon, authenticated;
GRANT INSERT ON public.price_updates TO authenticated;
GRANT ALL ON public.price_updates TO service_role;
ALTER TABLE public.price_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public audit read" ON public.price_updates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin audit insert" ON public.price_updates FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND created_by=auth.uid());
CREATE OR REPLACE FUNCTION public.apply_verified_prices(_update_id uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE r public.price_updates;
BEGIN
IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
SELECT * INTO STRICT r FROM public.price_updates WHERE id=_update_id;
UPDATE public.site_settings SET gold_usd=r.gold_usd,silver_usd=r.silver_usd,updated_at=r.verified_at WHERE id=1;
END; $$;
REVOKE ALL ON FUNCTION public.apply_verified_prices(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.apply_verified_prices(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.handle_first_admin() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
PERFORM pg_advisory_xact_lock(762301);
IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role='admin') THEN INSERT INTO public.user_roles(user_id,role) VALUES(new.id,'admin'); END IF;
RETURN new;
END; $$;