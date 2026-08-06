DROP POLICY IF EXISTS "Senders can delete their own message attachments" ON storage.objects;

CREATE POLICY "Senders can delete their own message attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND (string_to_array(name, '/'))[2] = auth.uid()::text
  AND public.user_can_access_thread((NULLIF((string_to_array(name, '/'))[1], ''))::uuid, auth.uid())
);

CREATE POLICY "Senders and admins can delete messages"
ON public.messages
FOR DELETE
TO authenticated
USING (
  (sender_id = auth.uid() AND public.user_can_access_thread(thread_id, auth.uid()))
  OR public.has_role(auth.uid(), 'admin'::app_role)
);