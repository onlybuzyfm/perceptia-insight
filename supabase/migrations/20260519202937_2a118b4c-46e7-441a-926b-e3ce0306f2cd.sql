
CREATE TYPE public.activity_status AS ENUM ('pendiente', 'en_progreso', 'completada');

CREATE TABLE public.project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  deadline timestamptz NOT NULL,
  status activity_status NOT NULL DEFAULT 'pendiente',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_activities_project ON public.project_activities(project_id);
CREATE INDEX idx_project_activities_deadline ON public.project_activities(deadline);

CREATE TABLE public.activity_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.project_activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, user_id)
);

CREATE INDEX idx_activity_assignees_user ON public.activity_assignees(user_id);

ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_assignees ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER project_activities_updated_at
BEFORE UPDATE ON public.project_activities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS project_activities
CREATE POLICY "project_activities_select"
  ON public.project_activities FOR SELECT
  TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR public.is_project_member(auth.uid(), project_id)
  );

CREATE POLICY "project_activities_staff_manage"
  ON public.project_activities FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "project_activities_update_status_assignee"
  ON public.project_activities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.activity_assignees aa
      WHERE aa.activity_id = id AND aa.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activity_assignees aa
      WHERE aa.activity_id = id AND aa.user_id = auth.uid()
    )
  );

-- RLS activity_assignees
CREATE POLICY "activity_assignees_select"
  ON public.activity_assignees FOR SELECT
  TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_activities pa
      WHERE pa.id = activity_id AND public.is_project_member(auth.uid(), pa.project_id)
    )
  );

CREATE POLICY "activity_assignees_staff_manage"
  ON public.activity_assignees FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
