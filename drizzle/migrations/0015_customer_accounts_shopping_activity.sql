CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, display_name text NOT NULL DEFAULT '', avatar_url text, email text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.profiles TO authenticated; GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer profile read" ON public.profiles FOR SELECT TO authenticated USING (id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.sync_customer_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.profiles(id,display_name,avatar_url,email) VALUES(new.id,coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name',''),new.raw_user_meta_data->>'avatar_url',coalesce(new.email,'')) ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name,avatar_url=excluded.avatar_url,email=excluded.email; RETURN new; END; $$;
CREATE TRIGGER sync_customer_profile AFTER INSERT OR UPDATE OF email,raw_user_meta_data ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_customer_profile();
INSERT INTO public.profiles(id,display_name,avatar_url,email,created_at) SELECT id,coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name',''),raw_user_meta_data->>'avatar_url',coalesce(email,''),created_at FROM auth.users;
CREATE TABLE public.customer_shopping (user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE, favorites uuid[] NOT NULL DEFAULT '{}', cart jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.customer_shopping TO authenticated; GRANT ALL ON public.customer_shopping TO service_role;
ALTER TABLE public.customer_shopping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer shopping read" ON public.customer_shopping FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TABLE public.customer_activity (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,event text NOT NULL,product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,quantity integer,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.customer_activity TO authenticated; GRANT ALL ON public.customer_activity TO service_role;
ALTER TABLE public.customer_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer activity read" ON public.customer_activity FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX customer_activity_lookup ON public.customer_activity(user_id,created_at DESC);
CREATE FUNCTION public.customer_shopping_action(_action text, _product_id uuid DEFAULT NULL, _quantity integer DEFAULT NULL, _guest jsonb DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE s public.customer_shopping; pair record; pid uuid; q integer; ev text; BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,42));
INSERT INTO public.customer_shopping(user_id) VALUES(auth.uid()) ON CONFLICT DO NOTHING;
SELECT * INTO s FROM public.customer_shopping WHERE user_id=auth.uid() FOR UPDATE;
IF _action IN ('favorite','add','quantity') THEN
IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=_product_id AND active) THEN RAISE EXCEPTION 'Product unavailable'; END IF;
IF _action IN ('add','quantity') AND coalesce(_quantity,1)>0 AND NOT EXISTS(SELECT 1 FROM public.products WHERE id=_product_id AND availability='available') THEN RAISE EXCEPTION 'Product unavailable'; END IF;
IF _action='favorite' THEN IF _product_id=ANY(s.favorites) THEN s.favorites=array_remove(s.favorites,_product_id); ev='favorite_removed'; ELSE s.favorites=array_append(s.favorites,_product_id); ev='favorite_added'; END IF;
ELSE q=CASE WHEN _action='add' THEN coalesce((s.cart->>_product_id::text)::integer,0)+1 ELSE _quantity END;
IF q IS NULL OR q<0 OR q>999 THEN RAISE EXCEPTION 'Quantity must be 0 to 999'; END IF;
IF q=0 THEN s.cart=s.cart-_product_id::text; ELSE s.cart=jsonb_set(s.cart,ARRAY[_product_id::text],to_jsonb(q)); END IF; ev=CASE WHEN _action='add' THEN 'cart_added' WHEN q=0 THEN 'cart_removed' ELSE 'cart_quantity' END;
END IF;
INSERT INTO public.customer_activity(user_id,event,product_id,quantity) VALUES(auth.uid(),ev,_product_id,q);
ELSIF _action='clear' THEN s.cart='{}'; INSERT INTO public.customer_activity(user_id,event) VALUES(auth.uid(),'cart_cleared');
ELSIF _action='merge' THEN
IF octet_length(coalesce(_guest::text,''))>100000 THEN RAISE EXCEPTION 'Guest shopping too large'; END IF;
FOR pair IN SELECT value FROM jsonb_array_elements_text(coalesce(_guest->'favorites','[]')) LOOP
IF pair.value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN pid=pair.value::uuid; IF NOT pid=ANY(s.favorites) AND EXISTS(SELECT 1 FROM public.products WHERE id=pid AND active) THEN s.favorites=array_append(s.favorites,pid); END IF; END IF;
END LOOP;
FOR pair IN SELECT key,value FROM jsonb_each_text(coalesce(_guest->'cart','{}')) LOOP
IF pair.key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' AND pair.value ~ '^[0-9]{1,3}$' THEN pid=pair.key::uuid; q=pair.value::integer; IF q>0 AND NOT s.cart ? pair.key AND EXISTS(SELECT 1 FROM public.products WHERE id=pid AND active AND availability='available') THEN s.cart=jsonb_set(s.cart,ARRAY[pair.key],to_jsonb(q)); END IF; END IF;
END LOOP;
IF jsonb_array_length(coalesce(_guest->'favorites','[]'))>0 OR coalesce(_guest->'cart','{}')<>'{}'::jsonb THEN INSERT INTO public.customer_activity(user_id,event) VALUES(auth.uid(),'guest_merged'); END IF;
ELSIF _action<>'read' THEN RAISE EXCEPTION 'Invalid shopping action'; END IF;
UPDATE public.customer_shopping SET favorites=s.favorites,cart=s.cart,updated_at=now() WHERE user_id=auth.uid();
RETURN jsonb_build_object('favorites',s.favorites,'cart',s.cart); END; $$;
REVOKE ALL ON FUNCTION public.customer_shopping_action(text,uuid,integer,jsonb) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.customer_shopping_action(text,uuid,integer,jsonb) TO authenticated;
CREATE FUNCTION public.record_customer_view(_product_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,42));
IF EXISTS(SELECT 1 FROM public.products WHERE id=_product_id AND active) AND NOT EXISTS(SELECT 1 FROM public.customer_activity WHERE user_id=auth.uid() AND product_id=_product_id AND event='product_viewed' AND created_at>now()-interval '30 minutes') THEN INSERT INTO public.customer_activity(user_id,event,product_id) VALUES(auth.uid(),'product_viewed',_product_id); END IF; END; $$;
REVOKE ALL ON FUNCTION public.record_customer_view(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.record_customer_view(uuid) TO authenticated;