REVOKE SELECT ON public.price_updates FROM anon, authenticated;
GRANT SELECT (id, gold_usd, silver_usd, gold_source_url, silver_source_url, gold_source_at, silver_source_at, verified_at, summary_ar, summary_en) ON public.price_updates TO anon, authenticated;
GRANT SELECT ON public.price_updates TO service_role;
DROP POLICY IF EXISTS "Public can read verified price summary" ON public.price_updates;
CREATE POLICY "Public can read verified price summary" ON public.price_updates FOR SELECT TO anon, authenticated USING (true);
CREATE OR REPLACE FUNCTION public.latest_verified_price()
 RETURNS TABLE(id uuid, gold_usd numeric, silver_usd numeric, gold_source_url text, silver_source_url text, gold_source_at timestamp with time zone, silver_source_at timestamp with time zone, verified_at timestamp with time zone, summary_ar text, summary_en text)
 LANGUAGE sql STABLE SECURITY INVOKER SET search_path TO 'public'
AS $$ SELECT id, gold_usd, silver_usd, gold_source_url, silver_source_url, gold_source_at, silver_source_at, verified_at, summary_ar, summary_en FROM public.price_updates ORDER BY verified_at DESC LIMIT 1 $$;