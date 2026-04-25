-- 1. Extender profiles con campos académicos
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paralelo text,
  ADD COLUMN IF NOT EXISTS codigo_estudiantil text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS interest_line_id uuid REFERENCES public.research_lines(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_codigo_estudiantil_unique
  ON public.profiles(codigo_estudiantil)
  WHERE codigo_estudiantil IS NOT NULL;

-- 2. Sincronizar email desde auth.users en el trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'estudiante')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill de emails existentes
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3. Función segura para listar usuarios con last_sign_in_at (solo staff)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT u.id, u.email::text, u.last_sign_in_at, u.created_at
  FROM auth.users u;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- 4. Migrar enum project_status al nuevo conjunto
ALTER TYPE public.project_status RENAME TO project_status_old;

CREATE TYPE public.project_status AS ENUM (
  'propuesto',
  'planificacion',
  'activo',
  'pausado',
  'finalizado',
  'publicado',
  'archivado'
);

ALTER TABLE public.projects
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE public.project_status USING (
    CASE status::text
      WHEN 'en_diseno' THEN 'planificacion'
      WHEN 'en_curso' THEN 'activo'
      WHEN 'activo' THEN 'activo'
      WHEN 'piloto' THEN 'activo'
      WHEN 'finalizado' THEN 'finalizado'
      ELSE 'propuesto'
    END
  )::public.project_status,
  ALTER COLUMN status SET DEFAULT 'propuesto'::public.project_status;

DROP TYPE public.project_status_old;