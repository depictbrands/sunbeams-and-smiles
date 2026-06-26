
CREATE OR REPLACE FUNCTION public.user_can_access_thread(_thread_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.message_threads t
    WHERE t.id = _thread_id
      AND (
        t.parent_id = _user_id
        OR t.assigned_teacher_id = _user_id
        OR public.has_role(_user_id, 'admin')
        OR public.has_role(_user_id, 'teacher')
      )
  );
$$;
