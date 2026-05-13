
-- Teams as a first-class concept (separate from projects)
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  focus text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role_in_team text NOT NULL DEFAULT 'integrante',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE public.team_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, project_id)
);

CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  url text,
  event_date date,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  result text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, competition_id)
);

-- Helper
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_members WHERE user_id = _user_id AND team_id = _team_id)
$$;

-- RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY teams_select ON public.teams FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY teams_staff_manage ON public.teams FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE POLICY team_members_select ON public.team_members FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_staff(auth.uid()) OR is_team_member(auth.uid(), team_id));
CREATE POLICY team_members_staff_manage ON public.team_members FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE POLICY team_projects_select ON public.team_projects FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY team_projects_staff_manage ON public.team_projects FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE POLICY competitions_select ON public.competitions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY competitions_staff_manage ON public.competitions FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

CREATE POLICY team_competitions_select ON public.team_competitions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY team_competitions_staff_manage ON public.team_competitions FOR ALL TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));

-- updated_at triggers
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER competitions_updated_at BEFORE UPDATE ON public.competitions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the 4 teams
INSERT INTO public.teams (name, slug, description, focus) VALUES
  ('Equipo Nexus', 'nexus', 'Agente académico / automatización inteligente.', 'Agentes IA y automatización'),
  ('Equipo Prisma', 'prisma', 'Dataset / CVAT / clasificación o detección visual.', 'Visión por computador'),
  ('Equipo Vector', 'vector', 'Prototipo inteligente / robot / IA ligera.', 'IA embebida y prototipos'),
  ('Equipo Sinapsis', 'sinapsis', 'Análisis de datos, clustering, detección o lavado de activos.', 'Análisis de datos y ML');

-- Remove the duplicated "Equipo X" entries from projects (they were a temporary placeholder)
DELETE FROM public.projects WHERE slug IN ('equipo-nexus','equipo-prisma','equipo-vector','equipo-sinapsis');
