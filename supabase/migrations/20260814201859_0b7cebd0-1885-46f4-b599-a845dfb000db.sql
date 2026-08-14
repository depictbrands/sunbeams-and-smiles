DROP POLICY IF EXISTS "Staff views permitted threads" ON public.message_threads;
CREATE POLICY "Staff views permitted threads"
ON public.message_threads FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'teacher') AND assigned_teacher_id = auth.uid())
);

DROP POLICY IF EXISTS "Staff updates permitted threads" ON public.message_threads;
CREATE POLICY "Staff updates permitted threads"
ON public.message_threads FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'teacher') AND assigned_teacher_id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'teacher') AND assigned_teacher_id = auth.uid())
);