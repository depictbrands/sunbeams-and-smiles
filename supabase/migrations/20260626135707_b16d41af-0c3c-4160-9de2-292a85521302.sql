CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  attachment_path TEXT,
  attachment_name TEXT,
  attachment_mime TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pinned BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert announcements"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete announcements"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_announcements_active_pinned_pub
  ON public.announcements (is_active, pinned DESC, published_at DESC);

-- Storage policies for announcement-files bucket (bucket created via tool)
CREATE POLICY "Authenticated can read announcement files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'announcement-files');

CREATE POLICY "Admins can upload announcement files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'announcement-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update announcement files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'announcement-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete announcement files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'announcement-files' AND public.has_role(auth.uid(), 'admin'));