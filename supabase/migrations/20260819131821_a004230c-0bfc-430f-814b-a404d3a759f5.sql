CREATE OR REPLACE FUNCTION public.enforce_thread_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_teacher_id IS DISTINCT FROM OLD.assigned_teacher_id
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can change the assigned teacher of a thread';
  END IF;
  IF NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
    RAISE EXCEPTION 'The parent of a thread cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_thread_assignment() FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_enforce_thread_assignment ON public.message_threads;
CREATE TRIGGER trg_enforce_thread_assignment
BEFORE UPDATE ON public.message_threads
FOR EACH ROW EXECUTE FUNCTION public.enforce_thread_assignment();

DROP POLICY IF EXISTS "Senders can update their own message attachments" ON storage.objects;
CREATE POLICY "Senders can update their own message attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (string_to_array(name, '/'))[2] = auth.uid()::text
  AND public.user_can_access_thread(NULLIF((string_to_array(name, '/'))[1], '')::uuid, auth.uid())
)
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (string_to_array(name, '/'))[2] = auth.uid()::text
  AND public.user_can_access_thread(NULLIF((string_to_array(name, '/'))[1], '')::uuid, auth.uid())
);