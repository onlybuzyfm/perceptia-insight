
ALTER TABLE public.weekly_updates ADD COLUMN IF NOT EXISTS evidence_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'update-evidences',
  'update-evidences',
  false,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','application/zip','application/x-zip-compressed','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "evidences_select_own_or_staff"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'update-evidences'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid()))
);

CREATE POLICY "evidences_insert_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'update-evidences'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "evidences_update_own"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'update-evidences'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "evidences_delete_own_or_admin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'update-evidences'
  AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin'))
);
