-- Public buckets serve files via their public URL without needing a SELECT policy.
-- Removing the broad SELECT policy prevents API-level listing/enumeration of all files
-- while keeping direct public URL access to avatars working.
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
