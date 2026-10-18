-- READ-ONLY preflight. Run in the Supabase SQL editor BEFORE applying migrations
-- to an existing project. It changes nothing; it shows what already exists so
-- you can confirm V2's guarded drop (which refuses to run if V1 tables hold rows).
SELECT 'public tables' AS what, table_name, (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', table_name), false, true, '')))[1]::text AS row_count
FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'app tables', table_name, NULL FROM information_schema.tables WHERE table_schema = 'app'
UNION ALL
SELECT 'auth users', count(*)::text, NULL FROM auth.users
UNION ALL
SELECT 'storage buckets', id, CASE WHEN public THEN 'PUBLIC' ELSE 'private' END FROM storage.buckets;
