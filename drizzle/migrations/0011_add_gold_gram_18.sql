ALTER TABLE public.site_settings ADD COLUMN gold_gram_18 numeric;

ALTER TABLE public.products DROP CONSTRAINT product_karat_supported;
ALTER TABLE public.products ADD CONSTRAINT product_karat_supported CHECK (karat IS NULL OR karat = ANY (ARRAY[18, 21, 24]));