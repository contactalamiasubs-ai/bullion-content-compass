ALTER TABLE public.products ADD COLUMN making_charge numeric NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD CONSTRAINT products_making_charge_valid CHECK (making_charge >= 0 AND making_charge < 'Infinity'::numeric);
COMMENT ON COLUMN public.products.making_charge IS 'Fixed EGP making charge per product, added once to weight times karat gram rate when gram pricing is enabled.';