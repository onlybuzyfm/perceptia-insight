-- Trigger 1: al asignar un proyecto a un equipo, agregar todos los miembros del equipo al proyecto
CREATE OR REPLACE FUNCTION public.sync_team_project_members()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role_in_project)
  SELECT NEW.project_id, tm.user_id, 'integrante'
  FROM public.team_members tm
  WHERE tm.team_id = NEW.team_id
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_team_project_members ON public.team_projects;
CREATE TRIGGER trg_sync_team_project_members
AFTER INSERT ON public.team_projects
FOR EACH ROW
EXECUTE FUNCTION public.sync_team_project_members();

-- Trigger 2: al añadir un miembro a un equipo, agregarlo a todos los proyectos del equipo
CREATE OR REPLACE FUNCTION public.sync_new_team_member_projects()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.project_members (project_id, user_id, role_in_project)
  SELECT tp.project_id, NEW.user_id, 'integrante'
  FROM public.team_projects tp
  WHERE tp.team_id = NEW.team_id
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_new_team_member_projects ON public.team_members;
CREATE TRIGGER trg_sync_new_team_member_projects
AFTER INSERT ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.sync_new_team_member_projects();

-- Evitar duplicados en project_members
CREATE UNIQUE INDEX IF NOT EXISTS project_members_project_user_uq
ON public.project_members (project_id, user_id);

-- Backfill: aplicar la regla a los datos existentes
INSERT INTO public.project_members (project_id, user_id, role_in_project)
SELECT tp.project_id, tm.user_id, 'integrante'
FROM public.team_projects tp
JOIN public.team_members tm ON tm.team_id = tp.team_id
ON CONFLICT DO NOTHING;