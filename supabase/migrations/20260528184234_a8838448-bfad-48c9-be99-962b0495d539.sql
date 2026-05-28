-- 1. Newsletter subscribers: explicit admin-only read access (defense in depth)
CREATE POLICY "Admins view subscribers"
ON public.newsletter_subscribers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Avatars storage: replace brittle substring-match SELECT policy with clear public-read
DROP POLICY IF EXISTS "Avatar files readable by known object URL" ON storage.objects;

CREATE POLICY "Avatars are publicly readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars'::text);
