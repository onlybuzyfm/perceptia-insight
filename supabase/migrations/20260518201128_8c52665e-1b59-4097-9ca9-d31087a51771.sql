
CREATE TYPE public.attendance_status AS ENUM ('presente', 'ausente', 'tardanza', 'justificado');

CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  meeting_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  research_line_id UUID REFERENCES public.research_lines(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY meetings_select_authenticated ON public.meetings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY meetings_staff_manage ON public.meetings
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER meetings_set_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.meeting_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'ausente',
  notes TEXT,
  marked_by UUID,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);

CREATE INDEX idx_meeting_attendance_meeting ON public.meeting_attendance(meeting_id);
CREATE INDEX idx_meeting_attendance_user ON public.meeting_attendance(user_id);

ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendance_select_own_or_staff ON public.meeting_attendance
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY attendance_staff_manage ON public.meeting_attendance
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
