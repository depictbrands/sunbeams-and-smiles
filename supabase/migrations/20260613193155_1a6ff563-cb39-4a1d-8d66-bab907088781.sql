
-- 1) Restrict allowed_students to staff only
CREATE POLICY "Staff view allowed students"
  ON public.allowed_students FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage allowed students"
  ON public.allowed_students FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) Stop exposing teacher emails to all authenticated users.
DROP POLICY IF EXISTS "Authenticated view teacher profiles" ON public.profiles;

-- Public-safe view for teacher directory (no email)
CREATE OR REPLACE VIEW public.teacher_profiles_public
WITH (security_invoker = on) AS
SELECT p.user_id, p.display_name, p.avatar_url
FROM public.profiles p
WHERE EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.user_id AND ur.role = 'teacher'
);

-- Allow read access to this view's underlying rows for authenticated users
CREATE POLICY "Authenticated view teacher display info"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = profiles.user_id AND ur.role = 'teacher'
    )
    AND current_setting('request.jwt.claims', true) IS NOT NULL
    AND false -- direct profile SELECT for teachers is blocked; use the view
  );

DROP POLICY IF EXISTS "Authenticated view teacher display info" ON public.profiles;

GRANT SELECT ON public.teacher_profiles_public TO authenticated, anon;
