CREATE POLICY "Admin creates thread with parent"
ON public.message_threads FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  AND assigned_teacher_id = auth.uid()
);