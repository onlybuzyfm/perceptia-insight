-- Helpers (evitan usar el literal enum recién creado)
CREATE OR REPLACE FUNCTION public.is_teacher(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'docente_asociado'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_project_teacher(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id
      AND project_id = _project_id
      AND role_in_project = 'docente'
  )
$$;

-- PROJECTS
CREATE POLICY "projects_teacher_select" ON public.projects
  FOR SELECT TO authenticated
  USING (public.is_project_teacher(auth.uid(), id));

CREATE POLICY "projects_teacher_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_teacher(auth.uid()));

CREATE POLICY "projects_teacher_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.is_project_teacher(auth.uid(), id))
  WITH CHECK (public.is_project_teacher(auth.uid(), id));

-- PROJECT_MEMBERS: docente puede gestionar integrantes de sus proyectos;
-- y puede insertarse a sí mismo como 'docente' al crear el proyecto.
CREATE POLICY "project_members_teacher_self_join" ON public.project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND role_in_project = 'docente' AND public.is_teacher(auth.uid())
  );

CREATE POLICY "project_members_teacher_manage" ON public.project_members
  FOR ALL TO authenticated
  USING (public.is_project_teacher(auth.uid(), project_id))
  WITH CHECK (public.is_project_teacher(auth.uid(), project_id));

-- WEEKLY_UPDATES
CREATE POLICY "weekly_updates_teacher_select" ON public.weekly_updates
  FOR SELECT TO authenticated
  USING (project_id IS NOT NULL AND public.is_project_teacher(auth.uid(), project_id));

CREATE POLICY "weekly_updates_teacher_insert" ON public.weekly_updates
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND project_id IS NOT NULL
    AND public.is_project_teacher(auth.uid(), project_id)
  );

CREATE POLICY "weekly_updates_teacher_update" ON public.weekly_updates
  FOR UPDATE TO authenticated
  USING (project_id IS NOT NULL AND public.is_project_teacher(auth.uid(), project_id))
  WITH CHECK (project_id IS NOT NULL AND public.is_project_teacher(auth.uid(), project_id));

-- EVALUATIONS
CREATE POLICY "evaluations_teacher_manage" ON public.evaluations
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.weekly_updates wu
    WHERE wu.id = evaluations.weekly_update_id
      AND wu.project_id IS NOT NULL
      AND public.is_project_teacher(auth.uid(), wu.project_id)
  ))
  WITH CHECK (
    evaluator_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.weekly_updates wu
      WHERE wu.id = evaluations.weekly_update_id
        AND wu.project_id IS NOT NULL
        AND public.is_project_teacher(auth.uid(), wu.project_id)
    )
  );