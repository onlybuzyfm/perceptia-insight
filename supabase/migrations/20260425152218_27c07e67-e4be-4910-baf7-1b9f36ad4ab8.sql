-- Fix function search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Replace permissive insert with bounded checks
DROP POLICY IF EXISTS "applications_insert_public" ON public.applications;
CREATE POLICY "applications_insert_public" ON public.applications FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 1 AND 200
    AND char_length(email) BETWEEN 3 AND 255
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(coalesce(message, '')) <= 4000
    AND char_length(coalesce(phone, '')) <= 50
    AND char_length(coalesce(carrera, '')) <= 200
    AND char_length(coalesce(semestre, '')) <= 50
    AND char_length(coalesce(interest_area, '')) <= 200
    AND status = 'pendiente'
    AND reviewed_by IS NULL
  );