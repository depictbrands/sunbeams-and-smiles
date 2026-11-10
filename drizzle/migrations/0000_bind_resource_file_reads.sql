DROP POLICY IF EXISTS "Signed-in users can read menu files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read school calendars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can read announcement files" ON storage.objects;

CREATE POLICY "Signed-in users can read menu files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-menus' AND (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.school_menus m WHERE m.file_path = storage.objects.name AND m.is_active)));

CREATE POLICY "Authenticated can read school calendars" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-calendars' AND (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.school_calendars c WHERE c.file_path = storage.objects.name AND c.is_active)));

CREATE POLICY "Authenticated can read announcement files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'announcement-files' AND (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'teacher') AND owner_id = (auth.uid())::text)
  OR EXISTS (SELECT 1 FROM public.announcements a WHERE a.attachment_path = storage.objects.name
     AND (a.created_by = auth.uid() OR (a.is_active AND (public.has_role(auth.uid(), 'teacher') OR public.user_matches_audience_group(auth.uid(), a.audience_group)))))
));