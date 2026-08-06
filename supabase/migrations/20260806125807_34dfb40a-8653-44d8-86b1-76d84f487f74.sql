CREATE TABLE public.teacher_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_invites TO authenticated;
GRANT ALL ON public.teacher_invites TO service_role;

ALTER TABLE public.teacher_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage teacher invites"
ON public.teacher_invites FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.grant_teacher_role_from_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.teacher_invites ti WHERE lower(ti.email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'teacher')
    ON CONFLICT (user_id, role) DO NOTHING;

    UPDATE public.teacher_invites
       SET claimed_at = now()
     WHERE lower(email) = lower(NEW.email) AND claimed_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_teacher_role_from_invite() FROM anon, authenticated;

CREATE TRIGGER on_auth_user_created_grant_teacher
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_teacher_role_from_invite();

CREATE TRIGGER on_auth_user_confirmed_grant_teacher
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_teacher_role_from_invite();

INSERT INTO public.teacher_invites (email, full_name) VALUES
  ('adriana@preescolarsonsoles.com', 'Adriana Espino Firpi'),
  ('beatriz@preescolarsonsoles.com', 'Beatriz Martín Marrero'),
  ('delma@preescolarsonsoles.com', 'Delma Soto Rivera'),
  ('esmeralda@preescolarsonsoles.com', 'Esmeralda Resto Reyes'),
  ('nilda@preescolarsonsoles.com', 'Nilda Casanova Márquez'),
  ('yeidy@preescolarsonsoles.com', 'Yeidy Mar Maldonado Arce')
ON CONFLICT (email) DO NOTHING;