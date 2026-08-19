DROP VIEW IF EXISTS public.teacher_profiles_public;

CREATE OR REPLACE FUNCTION public.list_teacher_directory()
RETURNS TABLE(user_id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role = 'teacher'
  )
    AND auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.list_teacher_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_teacher_directory() TO authenticated;