ALTER TABLE public.site_settings ADD COLUMN silver_gram numeric;
ALTER TABLE public.site_settings ADD CONSTRAINT silver_gram_positive CHECK (silver_gram IS NULL OR (silver_gram > 0 AND silver_gram < 1000000000));
ALTER TABLE public.products ADD COLUMN pricing_metal text NOT NULL DEFAULT 'gold';
ALTER TABLE public.products ADD CONSTRAINT product_pricing_metal_supported CHECK (pricing_metal IN ('gold', 'silver'));
ALTER TABLE public.products DROP CONSTRAINT product_gram_pricing_complete;
ALTER TABLE public.products ADD CONSTRAINT product_gram_pricing_complete CHECK (NOT gram_pricing OR (weight_grams IS NOT NULL AND (pricing_metal = 'silver' OR karat IS NOT NULL)));
COMMENT ON COLUMN public.products.pricing_metal IS 'Selects gold karat rate or the single silver gram rate for opt-in gram pricing; silver does not require karat.';