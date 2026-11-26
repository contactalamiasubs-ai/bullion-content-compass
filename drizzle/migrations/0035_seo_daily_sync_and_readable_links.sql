CREATE TABLE public.seo_sync_state (id integer PRIMARY KEY DEFAULT 1 CHECK(id=1), sitemap_hash text NOT NULL DEFAULT '', sitemap_status jsonb, submitted_at timestamptz, retry_at timestamptz, blocked boolean NOT NULL DEFAULT false);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.seo_sync_state TO authenticated;
GRANT ALL ON public.seo_sync_state TO service_role;
ALTER TABLE public.seo_sync_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY seo_sync_staff ON public.seo_sync_state FOR ALL TO authenticated USING(public.has_dashboard_permission(auth.uid(),'seo')) WITH CHECK(public.has_dashboard_permission(auth.uid(),'seo'));
CREATE OR REPLACE FUNCTION public.register_seo_content() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE base text; new_path text; old_path text; readable text; source jsonb;
BEGIN
base:=CASE TG_TABLE_NAME WHEN 'product_groups' THEN '/groups/' WHEN 'product_categories' THEN '/categories/' ELSE '/'||TG_TABLE_NAME||'/' END;
IF TG_OP='DELETE' THEN DELETE FROM public.seo_pages WHERE entity_type=TG_TABLE_NAME AND entity_id=OLD.id::text; RETURN OLD; END IF;
source:=to_jsonb(NEW); new_path:=base||CASE WHEN TG_TABLE_NAME='posts' THEN source->>'slug' ELSE NEW.id::text END;
IF TG_OP='UPDATE' AND TG_TABLE_NAME='posts' AND source->>'slug' IS DISTINCT FROM to_jsonb(OLD)->>'slug' THEN
old_path:=base||(to_jsonb(OLD)->>'slug');
DELETE FROM public.seo_redirects WHERE source_path=new_path;
UPDATE public.seo_pages SET path=new_path,canonical_url='',url_slug='',updated_at=now() WHERE path=old_path AND entity_type='posts';
INSERT INTO public.seo_redirects(source_path,target_path) VALUES(old_path,new_path) ON CONFLICT(source_path) DO UPDATE SET target_path=excluded.target_path,active=true;
END IF;
INSERT INTO public.seo_pages(path,entity_type,entity_id) VALUES(new_path,TG_TABLE_NAME,NEW.id::text) ON CONFLICT(path) DO UPDATE SET updated_at=now();
IF TG_OP='INSERT' AND TG_TABLE_NAME<>'posts' THEN
readable:=trim(both '-' from regexp_replace(lower(coalesce(source->>'name_en',source->>'title_en','')),'[^a-z0-9]+','-','g'));
IF readable<>'' THEN UPDATE public.seo_pages SET url_slug=left(readable,105)||'-'||left(replace(NEW.id::text,'-',''),8) WHERE path=new_path AND url_slug=''; END IF;
END IF;
RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.register_seo_content() FROM PUBLIC,anon,authenticated;