REVOKE EXECUTE ON FUNCTION public.handle_first_admin() FROM PUBLIC,anon,authenticated;
REVOKE SELECT ON public.price_updates FROM anon;
GRANT SELECT(id,gold_usd,silver_usd,gold_source_url,silver_source_url,gold_source_at,silver_source_at,verified_at,model,summary_ar,summary_en,source_payload,response_id) ON public.price_updates TO anon;