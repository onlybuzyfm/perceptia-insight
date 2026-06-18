
-- Add secondary email fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_secundario text,
  ADD COLUMN IF NOT EXISTS notificaciones_email_activas boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fecha_verificacion_email_secundario timestamptz;

-- Notification log table
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_destino text NOT NULL,
  subject text NOT NULL,
  notification_type text NOT NULL,
  estado_envio text NOT NULL DEFAULT 'pendiente' CHECK (estado_envio IN ('pendiente','enviado','error')),
  respuesta_webhook jsonb,
  payload jsonb,
  fecha_creacion timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_logs TO service_role;

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_logs_select_own_or_staff"
  ON public.notification_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

CREATE POLICY "notif_logs_admin_all"
  ON public.notification_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS notification_logs_user_idx ON public.notification_logs(user_id, fecha_creacion DESC);
