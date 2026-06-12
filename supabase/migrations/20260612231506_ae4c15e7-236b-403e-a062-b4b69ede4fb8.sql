CREATE TABLE public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_update_id uuid NOT NULL REFERENCES public.weekly_updates(id) ON DELETE CASCADE,
  evaluator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score int NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (weekly_update_id, evaluator_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT ALL ON public.evaluations TO service_role;

ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage evaluations"
ON public.evaluations FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()) AND evaluator_id = auth.uid());

CREATE POLICY "Students view own evaluations"
ON public.evaluations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_updates wu
    WHERE wu.id = evaluations.weekly_update_id
      AND wu.user_id = auth.uid()
  )
);

CREATE TRIGGER evaluations_set_updated_at
BEFORE UPDATE ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();