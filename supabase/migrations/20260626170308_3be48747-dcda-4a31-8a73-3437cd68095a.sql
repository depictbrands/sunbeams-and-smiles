
REVOKE EXECUTE ON FUNCTION public.link_documents_on_parent_activation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_documents_on_parent_activation() TO service_role;
