CREATE OR REPLACE FUNCTION public.user_matches_audience_group(_user_id uuid, _audience_group text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _audience_group IS NULL
      OR lower(regexp_replace(_audience_group, '[^a-zA-Z]', '', 'g')) = 'all'
      OR EXISTS (
        SELECT 1 FROM public.allowed_students s
        WHERE s.parent_user_id = _user_id
          AND s.status = 'active'
          AND lower(regexp_replace(coalesce(s.group_name, ''), '[^a-zA-Z]', '', 'g'))
              = lower(regexp_replace(_audience_group, '[^a-zA-Z]', '', 'g'))
      );
$$;

REVOKE ALL ON FUNCTION public.user_matches_audience_group(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_matches_audience_group(uuid, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated can view active announcements" ON public.announcements;

CREATE POLICY "Authenticated can view permitted announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR (created_by = auth.uid() AND has_role(auth.uid(), 'teacher'::app_role))
  OR (
    is_active = true
    AND (
      has_role(auth.uid(), 'teacher'::app_role)
      OR public.user_matches_audience_group(auth.uid(), audience_group)
    )
  )
);