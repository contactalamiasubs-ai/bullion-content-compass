CREATE TABLE public.google_login_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  client_id text NOT NULL DEFAULT '',
  client_secret text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.google_login_config TO service_role;
ALTER TABLE public.google_login_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.google_login_config (id) VALUES (1);
CREATE OR REPLACE FUNCTION public.public_google_login()
RETURNS TABLE(client_id text, enabled boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.client_id, (c.enabled AND c.client_id <> '' AND c.client_secret <> '') FROM public.google_login_config c WHERE c.id = 1
$$;
REVOKE ALL ON FUNCTION public.public_google_login() FROM public;
GRANT EXECUTE ON FUNCTION public.public_google_login() TO anon, authenticated, service_role;