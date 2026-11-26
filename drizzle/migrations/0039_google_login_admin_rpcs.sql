CREATE OR REPLACE FUNCTION public.google_login_status()
RETURNS TABLE(client_id text, has_secret boolean, enabled boolean, updated_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  RETURN QUERY SELECT c.client_id, c.client_secret <> '', c.enabled, c.updated_at FROM public.google_login_config c WHERE c.id = 1;
END $$;
CREATE OR REPLACE FUNCTION public.save_google_login(_client_id text, _client_secret text, _enabled boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501'; END IF;
  IF _client_id !~ '^[0-9A-Za-z_-]+\.apps\.googleusercontent\.com$' OR length(_client_id) > 200 THEN RAISE EXCEPTION 'invalid client id'; END IF;
  IF _client_secret IS NOT NULL AND _client_secret <> '' AND (length(_client_secret) > 200 OR _client_secret ~ '\s') THEN RAISE EXCEPTION 'invalid client secret'; END IF;
  UPDATE public.google_login_config SET client_id = _client_id,
    client_secret = CASE WHEN coalesce(_client_secret, '') = '' THEN client_secret ELSE _client_secret END,
    enabled = _enabled, updated_at = now() WHERE id = 1;
END $$;
REVOKE ALL ON FUNCTION public.google_login_status() FROM public, anon;
REVOKE ALL ON FUNCTION public.save_google_login(text, text, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.google_login_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_google_login(text, text, boolean) TO authenticated;