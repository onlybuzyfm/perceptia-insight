
-- 1. Agregar columna username a profiles (nullable inicialmente para poder backfill)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

-- 2. Backfill: generar username desde email para perfiles existentes
WITH base AS (
  SELECT
    p.id,
    lower(regexp_replace(split_part(coalesce(p.email, p.id::text), '@', 1), '[^a-z0-9_.]', '', 'g')) AS raw
  FROM public.profiles p
  WHERE p.username IS NULL
),
prepared AS (
  SELECT
    id,
    CASE
      WHEN length(raw) < 3 THEN 'user_' || substr(id::text, 1, 8)
      WHEN length(raw) > 30 THEN substr(raw, 1, 30)
      ELSE raw
    END AS base_name
  FROM base
),
numbered AS (
  SELECT
    id,
    base_name,
    row_number() OVER (PARTITION BY base_name ORDER BY id) AS rn
  FROM prepared
)
UPDATE public.profiles p
SET username = CASE
  WHEN n.rn = 1 THEN n.base_name
  ELSE substr(n.base_name, 1, 30 - length(n.rn::text) - 1) || '_' || n.rn::text
END
FROM numbered n
WHERE p.id = n.id;

-- 3. Hacer obligatorio + único + formato
ALTER TABLE public.profiles
  ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key
  ON public.profiles (lower(username));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format_chk
  CHECK (username ~ '^[a-z0-9_.]{3,30}$');

-- 4. Función trigger: autogenerar username único en handle_new_user si no viene en metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_username text;
  candidate text;
  suffix int := 0;
BEGIN
  -- Generar base desde metadata o email
  base_username := lower(regexp_replace(
    coalesce(
      NEW.raw_user_meta_data ->> 'username',
      split_part(NEW.email, '@', 1)
    ),
    '[^a-z0-9_.]', '', 'g'
  ));

  IF length(base_username) < 3 THEN
    base_username := 'user_' || substr(NEW.id::text, 1, 8);
  END IF;
  IF length(base_username) > 30 THEN
    base_username := substr(base_username, 1, 30);
  END IF;

  candidate := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = candidate) LOOP
    suffix := suffix + 1;
    candidate := substr(base_username, 1, 30 - length(suffix::text) - 1) || '_' || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, full_name, email, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    candidate
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'estudiante')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$;
