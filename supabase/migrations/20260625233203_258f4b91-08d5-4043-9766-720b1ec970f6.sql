
CREATE TABLE public.excused_late_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  excused_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.excused_late_updates TO authenticated;
GRANT ALL ON public.excused_late_updates TO service_role;

ALTER TABLE public.excused_late_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view excused late updates"
  ON public.excused_late_updates FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can manage excused late updates"
  ON public.excused_late_updates FOR ALL
  TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
