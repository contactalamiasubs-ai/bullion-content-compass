REVOKE SELECT ON public.price_updates FROM anon, authenticated;
GRANT SELECT (id, gold_usd, silver_usd, gold_source_url, silver_source_url, gold_source_at, silver_source_at, verified_at, summary_ar, summary_en) ON public.price_updates TO anon, authenticated;

DROP POLICY IF EXISTS "anyone send" ON public.contact_messages;
CREATE POLICY "anyone send" ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (phone IS NULL OR char_length(phone) <= 30)
  AND char_length(btrim(message)) BETWEEN 1 AND 2000
);