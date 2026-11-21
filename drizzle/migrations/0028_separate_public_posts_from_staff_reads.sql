ALTER POLICY "read published" ON public.posts TO authenticated;
CREATE POLICY "Visitors read published posts" ON public.posts FOR SELECT TO anon USING (published IS TRUE);