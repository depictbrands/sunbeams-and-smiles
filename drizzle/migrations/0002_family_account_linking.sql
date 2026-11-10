CREATE OR REPLACE FUNCTION public.enforce_thread_assignment()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.assigned_teacher_id IS DISTINCT FROM OLD.assigned_teacher_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can change the assigned teacher of a thread';
  END IF;
  IF NEW.parent_id IS DISTINCT FROM OLD.parent_id
     AND coalesce(current_setting('app.family_merge', true), '') <> 'on' THEN
    RAISE EXCEPTION 'The parent of a thread cannot be changed';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_link_student_to_parent(_student_id uuid, _parent_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Solo administradores'; END IF;
  IF _parent_email IS NULL OR btrim(_parent_email) = '' THEN
    UPDATE public.allowed_students SET parent_user_id = NULL WHERE id = _student_id;
    RETURN;
  END IF;
  SELECT user_id INTO _uid FROM public.profiles WHERE lower(email) = lower(btrim(_parent_email)) LIMIT 1;
  IF _uid IS NULL THEN RAISE EXCEPTION 'No existe una cuenta con ese correo'; END IF;
  UPDATE public.allowed_students SET parent_user_id = _uid WHERE id = _student_id;
  UPDATE public.parent_documents SET user_id = _uid WHERE student_id = _student_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_merge_parent_accounts(_from_email text, _to_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _from uuid; _to uuid; _s int; _d int; _t int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Solo administradores'; END IF;
  SELECT user_id INTO _from FROM public.profiles WHERE lower(email) = lower(btrim(_from_email)) LIMIT 1;
  SELECT user_id INTO _to FROM public.profiles WHERE lower(email) = lower(btrim(_to_email)) LIMIT 1;
  IF _from IS NULL OR _to IS NULL THEN RAISE EXCEPTION 'No se encontró una de las cuentas'; END IF;
  IF _from = _to THEN RAISE EXCEPTION 'Las dos cuentas son la misma'; END IF;
  PERFORM set_config('app.family_merge', 'on', true);
  UPDATE public.allowed_students SET parent_user_id = _to WHERE parent_user_id = _from; GET DIAGNOSTICS _s = ROW_COUNT;
  UPDATE public.parent_documents SET user_id = _to WHERE user_id = _from; GET DIAGNOSTICS _d = ROW_COUNT;
  UPDATE public.message_threads SET parent_id = _to WHERE parent_id = _from; GET DIAGNOSTICS _t = ROW_COUNT;
  INSERT INTO public.announcement_reads (announcement_id, user_id, read_at)
    SELECT r.announcement_id, _to, r.read_at FROM public.announcement_reads r
    WHERE r.user_id = _from
      AND NOT EXISTS (SELECT 1 FROM public.announcement_reads x WHERE x.user_id = _to AND x.announcement_id = r.announcement_id);
  PERFORM set_config('app.family_merge', 'off', true);
  RETURN jsonb_build_object('students', _s, 'documents', _d, 'threads', _t);
END; $$;

REVOKE ALL ON FUNCTION public.admin_link_student_to_parent(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_merge_parent_accounts(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_link_student_to_parent(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_merge_parent_accounts(text, text) TO authenticated;

CREATE POLICY "Parents read files of their documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'parent-documents' AND EXISTS (
  SELECT 1 FROM public.parent_documents d WHERE d.file_path = storage.objects.name AND d.user_id = auth.uid()));