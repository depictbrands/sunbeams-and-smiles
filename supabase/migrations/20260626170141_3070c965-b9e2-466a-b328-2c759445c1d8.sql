
ALTER TABLE public.parent_documents ALTER COLUMN user_id DROP NOT NULL;

-- Refresh parent SELECT policy to handle NULL user_id correctly
DROP POLICY IF EXISTS "Parents can view their own documents" ON public.parent_documents;
CREATE POLICY "Parents can view their own documents"
  ON public.parent_documents FOR SELECT
  TO authenticated
  USING (user_id IS NOT NULL AND auth.uid() = user_id);
