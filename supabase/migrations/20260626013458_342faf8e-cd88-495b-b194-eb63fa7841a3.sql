
-- 1) Add activity_id to weekly_updates
ALTER TABLE public.weekly_updates
  ADD COLUMN IF NOT EXISTS activity_id uuid NULL REFERENCES public.project_activities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS weekly_updates_activity_id_idx ON public.weekly_updates(activity_id);

-- 2) Allow docentes (project_members with role_in_project='docente') to manage activities of their own projects
DROP POLICY IF EXISTS project_activities_teacher_manage ON public.project_activities;
CREATE POLICY project_activities_teacher_manage ON public.project_activities
  FOR ALL TO authenticated
  USING (public.is_project_teacher(auth.uid(), project_id))
  WITH CHECK (public.is_project_teacher(auth.uid(), project_id));

-- 3) Same for activity_assignees on those projects
DROP POLICY IF EXISTS activity_assignees_teacher_manage ON public.activity_assignees;
CREATE POLICY activity_assignees_teacher_manage ON public.activity_assignees
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_activities pa
      WHERE pa.id = activity_assignees.activity_id
        AND public.is_project_teacher(auth.uid(), pa.project_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_activities pa
      WHERE pa.id = activity_assignees.activity_id
        AND public.is_project_teacher(auth.uid(), pa.project_id)
    )
  );
