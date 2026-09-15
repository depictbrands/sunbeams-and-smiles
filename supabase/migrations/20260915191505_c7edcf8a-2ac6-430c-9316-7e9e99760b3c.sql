CREATE TABLE public.school_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  period TEXT,
  file_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_menus TO authenticated;
GRANT ALL ON public.school_menus TO service_role;

ALTER TABLE public.school_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users can view active menus"
ON public.school_menus FOR SELECT TO authenticated
USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert menus"
ON public.school_menus FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update menus"
ON public.school_menus FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete menus"
ON public.school_menus FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_school_menus_updated_at
BEFORE UPDATE ON public.school_menus
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Signed-in users can read menu files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'school-menus');

CREATE POLICY "Admins can upload menu files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-menus' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update menu files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'school-menus' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete menu files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'school-menus' AND public.has_role(auth.uid(), 'admin'));