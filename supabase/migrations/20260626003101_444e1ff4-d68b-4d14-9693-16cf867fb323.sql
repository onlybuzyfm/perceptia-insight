ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS announcements_created_at_idx ON public.announcements (created_at DESC);