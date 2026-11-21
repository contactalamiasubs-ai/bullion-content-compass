CREATE OR REPLACE FUNCTION public.handle_first_admin() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.handle_first_admin() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.is_published_media(_url text) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
SELECT _url LIKE '/api/public/media/%' AND (
 EXISTS(SELECT 1 FROM public.products WHERE active IS TRUE AND image_url=_url) OR
 EXISTS(SELECT 1 FROM public.slides WHERE active IS TRUE AND (image_url=_url OR link=_url)) OR
 EXISTS(SELECT 1 FROM public.posts WHERE published IS TRUE AND image_url=_url) OR
 EXISTS(SELECT 1 FROM public.services WHERE image_url=_url) OR
 EXISTS(SELECT 1 FROM public.sections WHERE image_url=_url) OR
 EXISTS(SELECT 1 FROM public.site_settings WHERE id=1 AND (logo_url=_url OR app_link=_url OR (popup_enabled AND popup_link=_url) OR (serial_bg_enabled AND serial_bg_image=_url)))
); $$;
REVOKE ALL ON FUNCTION public.is_published_media(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_published_media(text) TO anon,authenticated,service_role;