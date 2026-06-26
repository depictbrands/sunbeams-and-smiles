
-- Convert has_role to SECURITY INVOKER. user_roles already has RLS allowing
-- authenticated users to read their own rows, so has_role(auth.uid(), ...) works.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Ensure callers can read user_roles for the check (RLS still restricts to own rows).
GRANT SELECT ON public.user_roles TO authenticated;
