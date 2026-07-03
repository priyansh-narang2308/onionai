-- Enable RLS on channel_types table (security fix)
ALTER TABLE public.channel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_types FORCE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (this is a lookup table)
DROP POLICY IF EXISTS "channel_types_public_read" ON public.channel_types;
DROP POLICY IF EXISTS "channel_types_auth_read" ON public.channel_types;
CREATE POLICY "channel_types_auth_read" ON public.channel_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Enable RLS on idea_groups table (lookup table)
ALTER TABLE public.idea_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_groups FORCE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (this is a lookup table)
DROP POLICY IF EXISTS "idea_groups_public_read" ON public.idea_groups;
DROP POLICY IF EXISTS "idea_groups_auth_read" ON public.idea_groups;
CREATE POLICY "idea_groups_auth_read" ON public.idea_groups
  FOR SELECT
  TO authenticated
  USING (true);


  
