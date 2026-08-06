-- Restrict teacher visibility to their own assigned threads
CREATE OR REPLACE FUNCTION public.user_can_access_thread(_thread_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.message_threads t
    WHERE t.id = _thread_id
      AND (
        t.parent_id = _user_id
        OR public.has_role(_user_id, 'admin')
        OR (
          public.has_role(_user_id, 'teacher')
          AND (t.assigned_teacher_id = _user_id OR t.assigned_teacher_id IS NULL)
        )
      )
  );
$function$;

-- message_threads
DROP POLICY IF EXISTS "Staff views all threads" ON public.message_threads;
DROP POLICY IF EXISTS "Staff updates threads" ON public.message_threads;

CREATE POLICY "Staff views permitted threads"
ON public.message_threads FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'teacher')
    AND (assigned_teacher_id = auth.uid() OR assigned_teacher_id IS NULL)
  )
);

CREATE POLICY "Staff updates permitted threads"
ON public.message_threads FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'teacher')
    AND (assigned_teacher_id = auth.uid() OR assigned_teacher_id IS NULL)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'teacher')
    AND (assigned_teacher_id = auth.uid() OR assigned_teacher_id IS NULL)
  )
);

-- messages
DROP POLICY IF EXISTS "Staff views all messages" ON public.messages;
DROP POLICY IF EXISTS "Staff posts in any thread" ON public.messages;
DROP POLICY IF EXISTS "Sender updates own message read state" ON public.messages;

CREATE POLICY "Staff views permitted messages"
ON public.messages FOR SELECT TO authenticated
USING (
  (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
  AND public.user_can_access_thread(thread_id, auth.uid())
);

CREATE POLICY "Staff posts in permitted threads"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
  AND public.user_can_access_thread(thread_id, auth.uid())
);

CREATE POLICY "Thread participants update read state"
ON public.messages FOR UPDATE TO authenticated
USING (public.user_can_access_thread(thread_id, auth.uid()))
WITH CHECK (public.user_can_access_thread(thread_id, auth.uid()));