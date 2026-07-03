-- Drop the permissive public SELECT policy on channel_types
-- channel_types is a global lookup table with no user_id column.
-- Authenticated users already have access via channel_types_auth_read.
DROP POLICY IF EXISTS "channel_types_public_read" ON public.channel_types;
