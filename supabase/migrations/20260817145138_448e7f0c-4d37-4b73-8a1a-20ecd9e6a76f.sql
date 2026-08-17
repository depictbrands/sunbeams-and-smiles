CREATE OR REPLACE FUNCTION public.user_matches_audience_group(_user_id uuid, _audience_group text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
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