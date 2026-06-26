
CREATE TABLE public.school_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  year integer NOT NULL,
  file_path text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_calendars TO authenticated;
GRANT ALL ON public.school_calendars TO service_role;

ALTER TABLE public.school_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active calendars"
  ON public.school_calendars FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert calendars"
  ON public.school_calendars FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update calendars"
  ON public.school_calendars FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete calendars"
  ON public.school_calendars FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_school_calendars_updated_at
  BEFORE UPDATE ON public.school_calendars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for school-calendars bucket
CREATE POLICY "Authenticated can read school calendars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'school-calendars');

CREATE POLICY "Admins can upload school calendars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'school-calendars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update school calendars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'school-calendars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete school calendars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'school-calendars' AND public.has_role(auth.uid(), 'admin'));
