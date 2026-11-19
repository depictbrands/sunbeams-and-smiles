DROP POLICY IF EXISTS "Signed-in users can read menu files" ON storage.objects;
CREATE POLICY "Signed-in users can read menu files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-menus' AND (select auth.uid()) IS NOT NULL AND (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.school_menus m WHERE m.file_path = objects.name AND m.is_active)
));
DROP POLICY IF EXISTS "Authenticated can read school calendars" ON storage.objects;
CREATE POLICY "Authenticated can read school calendars" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-calendars' AND (select auth.uid()) IS NOT NULL AND (
  public.has_role((select auth.uid()), 'admin'::public.app_role)
  OR EXISTS (SELECT 1 FROM public.school_calendars c WHERE c.file_path = objects.name AND c.is_active)
));