-- Add public-member flags to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_public_member boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_role text;

-- Public-safe RPC: returns only non-sensitive fields, only public members, only active
CREATE OR REPLACE FUNCTION public.get_public_members()
RETURNS TABLE (
  id uuid,
  full_name text,
  username text,
  public_role text,
  carrera text,
  bio text,
  avatar_url text,
  github_url text,
  linkedin_url text,
  interest_line_id uuid
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name, username, public_role, carrera, bio, avatar_url, github_url, linkedin_url, interest_line_id
  FROM public.profiles
  WHERE is_public_member = true AND is_active = true
  ORDER BY full_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_members() TO anon, authenticated;