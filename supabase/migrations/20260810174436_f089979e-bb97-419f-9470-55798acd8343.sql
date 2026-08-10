ALTER TABLE public.teacher_invites ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'teacher';

CREATE OR REPLACE FUNCTION public.grant_teacher_role_from_invite()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role public.app_role;
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL THEN
    SELECT ti.role INTO _role
    FROM public.teacher_invites ti
    WHERE lower(ti.email) = lower(NEW.email)
    LIMIT 1;

    IF _role IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, _role)
      ON CONFLICT (user_id, role) DO NOTHING;

      UPDATE public.teacher_invites
         SET claimed_at = now()
       WHERE lower(email) = lower(NEW.email) AND claimed_at IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;