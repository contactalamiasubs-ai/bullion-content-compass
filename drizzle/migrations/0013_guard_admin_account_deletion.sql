CREATE FUNCTION public.guard_last_admin_delete() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
IF OLD.role='admin' THEN
PERFORM pg_advisory_xact_lock(762301);
IF (SELECT count(*) FROM public.user_roles WHERE role='admin')<=1 THEN RAISE EXCEPTION 'يجب الاحتفاظ بمسؤول واحد على الأقل'; END IF;
END IF;
RETURN OLD;
END; $$;
REVOKE ALL ON FUNCTION public.guard_last_admin_delete() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_last_admin_delete BEFORE DELETE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.guard_last_admin_delete();
CREATE FUNCTION public.cleanup_deleted_dashboard_account() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
DELETE FROM public.dashboard_access WHERE user_id=OLD.id;
RETURN OLD;
END; $$;
REVOKE ALL ON FUNCTION public.cleanup_deleted_dashboard_account() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER cleanup_deleted_dashboard_account AFTER DELETE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.cleanup_deleted_dashboard_account();