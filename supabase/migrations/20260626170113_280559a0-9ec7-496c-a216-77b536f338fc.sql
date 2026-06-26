
ALTER TABLE public.parent_documents
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS jotform_submission_id TEXT;

CREATE INDEX IF NOT EXISTS parent_documents_student_id_idx
  ON public.parent_documents(student_id);

CREATE INDEX IF NOT EXISTS parent_documents_category_idx
  ON public.parent_documents(category);

CREATE UNIQUE INDEX IF NOT EXISTS parent_documents_jotform_unique
  ON public.parent_documents(jotform_submission_id)
  WHERE jotform_submission_id IS NOT NULL;
