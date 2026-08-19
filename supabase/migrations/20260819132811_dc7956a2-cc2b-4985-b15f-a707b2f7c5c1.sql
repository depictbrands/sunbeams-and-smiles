DROP VIEW IF EXISTS public.teacher_profiles_public;

CREATE VIEW public.teacher_profiles_public
WITH (security_invoker = off) AS
SELECT p.user_id, p.display_name, p.avatar_url
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.user_id AND ur.role = 'teacher'
);

REVOKE ALL ON public.teacher_profiles_public FROM anon;
GRANT SELECT ON public.teacher_profiles_public TO authenticated;
GRANT SELECT ON public.teacher_profiles_public TO service_role;

ALTER TABLE public.message_threads DISABLE TRIGGER trg_enforce_thread_assignment;

UPDATE public.message_threads t
SET assigned_teacher_id = m.user_id
FROM (
  SELECT p.user_id, lower(split_part(p.display_name, ' ', 1)) AS first_name
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role IN ('teacher','admin')
  )
) m
WHERE t.assigned_teacher_id IS NULL
  AND (
    lower(t.subject) LIKE '[para: ' || m.first_name || '%'
    OR (m.first_name = 'beatriz' AND lower(t.subject) LIKE '[para: bea]%')
  );

ALTER TABLE public.message_threads ENABLE TRIGGER trg_enforce_thread_assignment;