
CREATE TABLE public.telegram_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL UNIQUE,
  title text,
  registered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.telegram_groups TO authenticated;
GRANT ALL ON public.telegram_groups TO service_role;

ALTER TABLE public.telegram_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_groups" ON public.telegram_groups
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_telegram_groups_updated
  BEFORE UPDATE ON public.telegram_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
