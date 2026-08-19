CREATE TABLE public.announcement_reads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (announcement_id, user_id)
);

GRANT SELECT, INSERT ON public.announcement_reads TO authenticated;
GRANT ALL ON public.announcement_reads TO service_role;

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users record their own reads"
ON public.announcement_reads FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users view their own reads"
ON public.announcement_reads FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authors and admins view reads"
ON public.announcement_reads FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = announcement_reads.announcement_id
      AND a.created_by = auth.uid()
      AND public.has_role(auth.uid(), 'teacher')
  )
);

CREATE INDEX idx_announcement_reads_announcement ON public.announcement_reads(announcement_id);