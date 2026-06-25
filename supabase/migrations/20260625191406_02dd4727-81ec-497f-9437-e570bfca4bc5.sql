
-- Telegram link fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
  ADD COLUMN IF NOT EXISTS telegram_username TEXT,
  ADD COLUMN IF NOT EXISTS telegram_link_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notify_telegram BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON public.profiles(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_link_code ON public.profiles(telegram_link_code);

-- Log of telegram notifications sent
CREATE TABLE IF NOT EXISTS public.telegram_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id BIGINT,
  kind TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.telegram_notification_logs TO authenticated;
GRANT ALL ON public.telegram_notification_logs TO service_role;

ALTER TABLE public.telegram_notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins ven todos los logs telegram"
ON public.telegram_notification_logs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuarios ven sus propios logs telegram"
ON public.telegram_notification_logs FOR SELECT TO authenticated
USING (user_id = auth.uid());
