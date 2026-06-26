
-- Add attachment columns to messages
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_size integer;

-- Allow body to be nullable (an attachment-only message is valid)
ALTER TABLE public.messages ALTER COLUMN body DROP NOT NULL;

-- Helper to check if a user can access a thread (parent, assigned teacher, or staff)
CREATE OR REPLACE FUNCTION public.user_can_access_thread(_thread_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.message_threads t
    WHERE t.id = _thread_id
      AND (
        t.parent_id = _user_id
        OR t.assigned_teacher_id = _user_id
        OR public.has_role(_user_id, 'admin')
        OR public.has_role(_user_id, 'teacher')
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.user_can_access_thread(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_can_access_thread(uuid, uuid) TO authenticated, service_role;

-- Storage RLS policies for message-attachments bucket.
-- Path convention: <thread_id>/<sender_user_id>/<filename>
CREATE POLICY "Thread participants can read message attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND public.user_can_access_thread(
    NULLIF((string_to_array(name, '/'))[1], '')::uuid,
    auth.uid()
  )
);

CREATE POLICY "Thread participants can upload message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (string_to_array(name, '/'))[2] = auth.uid()::text
  AND public.user_can_access_thread(
    NULLIF((string_to_array(name, '/'))[1], '')::uuid,
    auth.uid()
  )
);

CREATE POLICY "Senders can delete their own message attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (string_to_array(name, '/'))[2] = auth.uid()::text
);
