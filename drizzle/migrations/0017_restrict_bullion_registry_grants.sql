REVOKE ALL ON public.bullion_serials FROM anon;
ALTER TABLE public.bullion_serials ADD CONSTRAINT serial_required_details CHECK (length(trim(name_ar)) > 0 AND length(trim(purity)) > 0);