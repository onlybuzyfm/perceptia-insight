
ALTER TABLE public.resources ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_resources_project_id ON public.resources(project_id);

DROP POLICY IF EXISTS resources_select_authenticated ON public.resources;

CREATE POLICY resources_select_scoped
  ON public.resources FOR SELECT
  TO authenticated
  USING (
    project_id IS NULL
    OR is_staff(auth.uid())
    OR is_project_member(auth.uid(), project_id)
  );
