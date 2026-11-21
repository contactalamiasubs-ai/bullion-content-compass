ALTER POLICY "public read" ON public.products USING (active IS TRUE);
ALTER POLICY "public read" ON public.slides USING (active IS TRUE);
ALTER POLICY "Public can read verified price summary" ON public.price_updates USING (verified_at IS NOT NULL);