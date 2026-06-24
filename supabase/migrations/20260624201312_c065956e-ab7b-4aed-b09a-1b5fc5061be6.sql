
-- 1. Extend allowed_students with status and parent linkage
ALTER TABLE public.allowed_students
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS parent_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.allowed_students
  DROP CONSTRAINT IF EXISTS allowed_students_status_check;
ALTER TABLE public.allowed_students
  ADD CONSTRAINT allowed_students_status_check CHECK (status IN ('active','inactive'));

CREATE UNIQUE INDEX IF NOT EXISTS allowed_students_student_number_key
  ON public.allowed_students (student_number);
CREATE UNIQUE INDEX IF NOT EXISTS allowed_students_parent_user_id_key
  ON public.allowed_students (parent_user_id) WHERE parent_user_id IS NOT NULL;

DROP TRIGGER IF EXISTS allowed_students_set_updated_at ON public.allowed_students;
CREATE TRIGGER allowed_students_set_updated_at
  BEFORE UPDATE ON public.allowed_students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Parent-facing view: their child's info WITHOUT exposing student_number
DROP VIEW IF EXISTS public.my_student;
CREATE VIEW public.my_student
WITH (security_invoker = on) AS
SELECT id, student_name, status, parent_user_id
FROM public.allowed_students
WHERE parent_user_id = auth.uid() AND status = 'active';

GRANT SELECT ON public.my_student TO authenticated;

-- 3. Allow parents to read ONLY their own linked row (still no number exposure: view drops the column;
--    direct base-table reads also allowed only to admins/teachers via existing staff policy).
--    We intentionally do NOT add a parent SELECT policy on the base table so student_number stays admin-only.
--    Parents must use the my_student view.
