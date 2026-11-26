DROP POLICY IF EXISTS "bullion_checks_insert" ON public.bullion_checks;
CREATE POLICY "bullion_checks_insert" ON public.bullion_checks FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(btrim(name)) BETWEEN 2 AND 100
  AND char_length(email) BETWEEN 5 AND 254
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(btrim(serial)) BETWEEN 1 AND 64
  AND customer_number IS NOT NULL
  AND char_length(btrim(customer_number)) BETWEEN 2 AND 40
  AND customer_number ~* '^[A-Z0-9 ._/-]+$'
);