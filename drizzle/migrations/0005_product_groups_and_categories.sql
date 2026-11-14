CREATE TABLE public.product_groups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name_ar text NOT NULL CHECK (char_length(btrim(name_ar)) BETWEEN 1 AND 100),
 name_en text NOT NULL DEFAULT '',
 sort integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.product_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_groups TO authenticated;
GRANT ALL ON public.product_groups TO service_role;
ALTER TABLE public.product_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read groups" ON public.product_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage groups" ON public.product_groups FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE public.product_categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 group_id uuid NOT NULL REFERENCES public.product_groups(id) ON DELETE RESTRICT,
 name_ar text NOT NULL CHECK (char_length(btrim(name_ar)) BETWEEN 1 AND 100),
 name_en text NOT NULL DEFAULT '',
 sort integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.product_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read categories" ON public.product_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage categories" ON public.product_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.product_categories(id) ON DELETE RESTRICT;
CREATE INDEX product_categories_group_idx ON public.product_categories(group_id);
CREATE INDEX products_category_idx ON public.products(category_id);