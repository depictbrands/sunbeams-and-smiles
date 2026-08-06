-- Teachers can publish announcements (weekly newsletters) they author
CREATE POLICY "Teachers can insert own announcements"
ON public.announcements FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND created_by = auth.uid());

CREATE POLICY "Teachers can update own announcements"
ON public.announcements FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role) AND created_by = auth.uid())
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND created_by = auth.uid());

CREATE POLICY "Teachers can delete own announcements"
ON public.announcements FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role) AND created_by = auth.uid());

-- Storage: teachers can upload/manage their own announcement attachments
CREATE POLICY "Teachers can upload announcement files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'announcement-files' AND has_role(auth.uid(), 'teacher'::app_role) AND owner = auth.uid());

CREATE POLICY "Teachers can update own announcement files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'announcement-files' AND has_role(auth.uid(), 'teacher'::app_role) AND owner = auth.uid());

CREATE POLICY "Teachers can delete own announcement files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'announcement-files' AND has_role(auth.uid(), 'teacher'::app_role) AND owner = auth.uid());