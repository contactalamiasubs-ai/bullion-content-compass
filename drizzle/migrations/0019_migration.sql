ALTER TABLE public.site_settings
  ADD COLUMN serial_bg_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN serial_bg_style text NOT NULL DEFAULT 'particles' CHECK (serial_bg_style IN ('particles','waves','shine')),
  ADD COLUMN serial_bg_speed integer NOT NULL DEFAULT 20 CHECK (serial_bg_speed BETWEEN 3 AND 120),
  ADD COLUMN serial_bg_image text;

CREATE TABLE public.bullion_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 100),
  email text NOT NULL CHECK (length(email) <= 255 AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  serial text NOT NULL CHECK (serial ~ '^[A-Z0-9./-]{1,100}$'),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.bullion_checks TO anon, authenticated;
GRANT SELECT, DELETE ON public.bullion_checks TO authenticated;
GRANT ALL ON public.bullion_checks TO service_role;
ALTER TABLE public.bullion_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY bullion_checks_insert ON public.bullion_checks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY bullion_checks_staff_read ON public.bullion_checks FOR SELECT TO authenticated USING (public.has_dashboard_permission(auth.uid(),'serials'));
CREATE POLICY bullion_checks_staff_delete ON public.bullion_checks FOR DELETE TO authenticated USING (public.has_dashboard_permission(auth.uid(),'serials'));