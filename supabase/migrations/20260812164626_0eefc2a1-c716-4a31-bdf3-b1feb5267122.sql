DROP POLICY IF EXISTS "Authenticated can view active announcements" ON public.announcements;
CREATE POLICY "Authenticated can view active announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (
  is_active = true
  OR public.has_role(auth.uid(), 'admin')
  OR (created_by = auth.uid() AND public.has_role(auth.uid(), 'teacher'))
);