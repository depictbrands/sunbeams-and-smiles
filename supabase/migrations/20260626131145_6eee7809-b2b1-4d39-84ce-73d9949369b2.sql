
-- Document type enum
CREATE TYPE public.parent_document_type AS ENUM ('documentos_anuales', 'vacunas', 'certificado_salud');

-- Table
CREATE TABLE public.parent_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type public.parent_document_type NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_documents TO authenticated;
GRANT ALL ON public.parent_documents TO service_role;

ALTER TABLE public.parent_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents manage own documents"
ON public.parent_documents FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all parent documents"
ON public.parent_documents FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

CREATE TRIGGER update_parent_documents_updated_at
BEFORE UPDATE ON public.parent_documents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies: files live under parent-documents/{auth.uid()}/...
CREATE POLICY "Parents read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'parent-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Parents upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'parent-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Parents update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'parent-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Parents delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'parent-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Staff read all parent files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'parent-documents'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
);
