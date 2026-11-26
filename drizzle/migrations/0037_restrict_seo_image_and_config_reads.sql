CREATE FUNCTION public.is_public_seo_image(_url text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
  SELECT _url IS NOT NULL AND _url <> '' AND (
    EXISTS (SELECT 1 FROM public.products WHERE active AND image_url = _url)
    OR EXISTS (SELECT 1 FROM public.slides WHERE active AND (image_url = _url OR link = _url))
    OR EXISTS (SELECT 1 FROM public.posts WHERE published AND (publish_at IS NULL OR publish_at <= now()) AND image_url = _url)
    OR EXISTS (SELECT 1 FROM public.services WHERE image_url = _url)
    OR EXISTS (SELECT 1 FROM public.sections WHERE image_url = _url)
    OR EXISTS (SELECT 1 FROM public.site_settings WHERE id = 1 AND (logo_url = _url OR app_link = _url OR login_logo_url = _url OR login_background_url = _url OR (popup_enabled AND popup_link = _url) OR (serial_bg_enabled AND serial_bg_image = _url)))
    OR EXISTS (SELECT 1 FROM public.seo_pages WHERE image_url = _url AND robots = 'index')
  );
$$;
REVOKE ALL ON FUNCTION public.is_public_seo_image(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_seo_image(text) TO anon, authenticated, service_role;
ALTER POLICY seo_images_public ON public.seo_images USING (public.is_public_seo_image(url));
DROP POLICY seo_config_public ON public.seo_config;
REVOKE SELECT ON public.seo_config FROM anon;
CREATE FUNCTION public.public_seo_tags()
RETURNS TABLE (google_verification text, bing_verification text, measurement_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT c.google_verification, c.bing_verification, c.measurement_id
  FROM public.seo_config c WHERE c.id = 1;
$$;
REVOKE ALL ON FUNCTION public.public_seo_tags() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_seo_tags() TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.public_seo_tags() IS 'Public website verification tags and analytics measurement identifier only; never returns configuration records or future configuration columns.';