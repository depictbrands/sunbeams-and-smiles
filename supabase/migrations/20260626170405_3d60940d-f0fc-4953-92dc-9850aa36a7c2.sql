
CREATE POLICY "Parents read own student expediente"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'parent-documents'
  AND (storage.foldername(name))[1] = 'students'
  AND EXISTS (
    SELECT 1 FROM public.allowed_students s
    WHERE s.id::text = (storage.foldername(name))[2]
      AND s.parent_user_id = auth.uid()
  )
);
