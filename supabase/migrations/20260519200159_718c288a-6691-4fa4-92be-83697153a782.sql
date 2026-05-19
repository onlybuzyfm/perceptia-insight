-- Función para saber si dos usuarios comparten algún equipo
CREATE OR REPLACE FUNCTION public.share_team(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm1
    JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = _a AND tm2.user_id = _b
  )
$$;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR is_staff(auth.uid())
  OR is_public_member = true
  OR public.share_team(auth.uid(), id)
);