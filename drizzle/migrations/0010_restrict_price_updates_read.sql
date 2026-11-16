DROP POLICY IF EXISTS "public audit read" ON public.price_updates;
CREATE POLICY "admin audit read" ON public.price_updates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.latest_verified_price()
RETURNS TABLE (id uuid, gold_usd numeric, silver_usd numeric, gold_source_url text, silver_source_url text, gold_source_at timestamptz, silver_source_at timestamptz, verified_at timestamptz, summary_ar text, summary_en text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, gold_usd, silver_usd, gold_source_url, silver_source_url, gold_source_at, silver_source_at, verified_at, summary_ar, summary_en
  FROM public.price_updates ORDER BY verified_at DESC LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.latest_verified_price() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.latest_verified_price() TO anon, authenticated;