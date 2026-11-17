CREATE TABLE public.bullion_serials (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 serial text NOT NULL UNIQUE,
 name_ar text NOT NULL DEFAULT '', name_en text NOT NULL DEFAULT '',
 weight_grams numeric NOT NULL DEFAULT 0 CHECK (weight_grams > 0),
 purity text NOT NULL DEFAULT '',
 specifications_ar text NOT NULL DEFAULT '', specifications_en text NOT NULL DEFAULT '',
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT serial_format CHECK (serial = upper(trim(serial)) AND serial ~ '^[A-Z0-9./-]{1,100}$'),
 CONSTRAINT serial_text_limits CHECK (length(name_ar) <= 300 AND length(name_en) <= 300 AND length(purity) <= 100 AND length(specifications_ar) <= 5000 AND length(specifications_en) <= 5000)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bullion_serials TO authenticated;
GRANT ALL ON public.bullion_serials TO service_role;
ALTER TABLE public.bullion_serials ENABLE ROW LEVEL SECURITY;
CREATE POLICY serial_product_management ON public.bullion_serials FOR ALL TO authenticated USING (public.has_dashboard_permission(auth.uid(), 'products')) WITH CHECK (public.has_dashboard_permission(auth.uid(), 'products'));
CREATE FUNCTION public.lookup_bullion_serial(_serial text) RETURNS TABLE(serial text, name_ar text, name_en text, weight_grams numeric, purity text, specifications_ar text, specifications_en text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT b.serial,b.name_ar,b.name_en,b.weight_grams,b.purity,b.specifications_ar,b.specifications_en FROM public.bullion_serials b WHERE b.active AND b.serial=upper(trim(_serial)) AND length(_serial) BETWEEN 1 AND 100 LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.lookup_bullion_serial(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_bullion_serial(text) TO anon, authenticated;
