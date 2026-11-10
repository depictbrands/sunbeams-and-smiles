-- Run as a read-only database regression check.
-- A unique single-column parent index would prevent linking siblings.
SELECT NOT EXISTS (
  SELECT 1
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid
    AND a.attnum = ANY(i.indkey)
  WHERE i.indrelid = 'public.allowed_students'::regclass
    AND i.indisunique
    AND i.indnkeyatts = 1
    AND a.attname = 'parent_user_id'
) AS siblings_can_share_parent_account;