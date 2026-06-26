
CREATE OR REPLACE FUNCTION public.link_documents_on_parent_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.parent_user_id IS NOT NULL AND (OLD.parent_user_id IS DISTINCT FROM NEW.parent_user_id) THEN
    UPDATE public.parent_documents
       SET user_id = NEW.parent_user_id
     WHERE student_id = NEW.id
       AND user_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS link_docs_on_activation ON public.allowed_students;
CREATE TRIGGER link_docs_on_activation
AFTER UPDATE ON public.allowed_students
FOR EACH ROW EXECUTE FUNCTION public.link_documents_on_parent_activation();
