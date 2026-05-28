CREATE TABLE public.allowed_students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_number text NOT NULL UNIQUE,
  student_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Locked down: only the backend signup function (service_role) may read/write.
-- No anon/authenticated access — student numbers must never be enumerable by the public.
GRANT ALL ON public.allowed_students TO service_role;

ALTER TABLE public.allowed_students ENABLE ROW LEVEL SECURITY;

-- Intentionally NO policies for anon/authenticated: this table is private and
-- accessed exclusively by the secure signup edge function via service_role.