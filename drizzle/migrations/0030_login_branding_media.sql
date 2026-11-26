CREATE OR REPLACE FUNCTION public.is_published_media(_url text)
 RETURNS boolean LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
SELECT _url LIKE '/api/public/media/%' AND (
 EXISTS(SELECT 1 FROM public.products WHERE active IS TRUE AND image_url=_url) OR
 EXISTS(SELECT 1 FROM public.slides WHERE active IS TRUE AND (image_url=_url OR link=_url)) OR
 EXISTS(SELECT 1 FROM public.posts WHERE published IS TRUE AND image_url=_url) OR
 EXISTS(SELECT 1 FROM public.services WHERE image_url=_url) OR
 EXISTS(SELECT 1 FROM public.sections WHERE image_url=_url) OR
 EXISTS(SELECT 1 FROM public.site_settings WHERE id=1 AND (logo_url=_url OR app_link=_url OR login_logo_url=_url OR login_background_url=_url OR (popup_enabled AND popup_link=_url) OR (serial_bg_enabled AND serial_bg_image=_url)))
); $function$;