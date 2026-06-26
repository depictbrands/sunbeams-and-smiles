
-- Add new document type for admin-assigned files
ALTER TYPE public.parent_document_type ADD VALUE IF NOT EXISTS 'admin_assigned';

-- Add metadata columns
ALTER TABLE public.parent_documents
  ADD COLUMN IF NOT EXISTS uploaded_by uuid,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.allowed_students(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_parent_documents_student ON public.parent_documents(student_id);

-- Allow staff (admin/teacher) to insert/update/delete documents for any parent
DROP POLICY IF EXISTS "Staff manage parent documents" ON public.parent_documents;
CREATE POLICY "Staff manage parent documents"
ON public.parent_documents
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Storage: allow staff to upload/update/delete files in parent-documents bucket
DROP POLICY IF EXISTS "Staff upload parent files" ON storage.objects;
CREATE POLICY "Staff upload parent files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'parent-documents'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

DROP POLICY IF EXISTS "Staff update parent files" ON storage.objects;
CREATE POLICY "Staff update parent files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'parent-documents'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);

DROP POLICY IF EXISTS "Staff delete parent files" ON storage.objects;
CREATE POLICY "Staff delete parent files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'parent-documents'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);
