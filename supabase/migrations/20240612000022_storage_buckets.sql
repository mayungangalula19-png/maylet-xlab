-- Storage buckets used by Profile, Documents, Research, Prototypes, Careers
-- Safe to re-run (ON CONFLICT / DROP POLICY IF EXISTS)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'avatars',
    'avatars',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'project-documents',
    'project-documents',
    true,
    52428800,
    NULL
  ),
  (
    'prototypes',
    'prototypes',
    true,
    52428800,
    NULL
  ),
  (
    'career-resumes',
    'career-resumes',
    false,
    5242880,
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── avatars (Profile page) ───────────────────────────────────
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (name LIKE auth.uid()::text || '-%' OR name LIKE auth.uid()::text || '/%')
  );

DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (name LIKE auth.uid()::text || '-%' OR name LIKE auth.uid()::text || '/%')
  );

DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;
CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (name LIKE auth.uid()::text || '-%' OR name LIKE auth.uid()::text || '/%')
  );

-- ── project-documents (Documents + Research uploads) ─────────
DROP POLICY IF EXISTS "project_documents_select" ON storage.objects;
CREATE POLICY "project_documents_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'project-documents');

DROP POLICY IF EXISTS "project_documents_insert" ON storage.objects;
CREATE POLICY "project_documents_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-documents');

DROP POLICY IF EXISTS "project_documents_update" ON storage.objects;
CREATE POLICY "project_documents_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'project-documents');

DROP POLICY IF EXISTS "project_documents_delete" ON storage.objects;
CREATE POLICY "project_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-documents');

-- ── prototypes ───────────────────────────────────────────────
DROP POLICY IF EXISTS "prototypes_select" ON storage.objects;
CREATE POLICY "prototypes_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'prototypes');

DROP POLICY IF EXISTS "prototypes_insert" ON storage.objects;
CREATE POLICY "prototypes_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prototypes');

DROP POLICY IF EXISTS "prototypes_update" ON storage.objects;
CREATE POLICY "prototypes_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'prototypes');

DROP POLICY IF EXISTS "prototypes_delete" ON storage.objects;
CREATE POLICY "prototypes_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'prototypes');

-- ── career-resumes (may already exist from phase2 migration) ───
DROP POLICY IF EXISTS "career_resumes_insert" ON storage.objects;
CREATE POLICY "career_resumes_insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'career-resumes');

DROP POLICY IF EXISTS "career_resumes_admin_select" ON storage.objects;
CREATE POLICY "career_resumes_admin_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'career-resumes' AND public.is_admin());

DROP POLICY IF EXISTS "career_resumes_admin_delete" ON storage.objects;
CREATE POLICY "career_resumes_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'career-resumes' AND public.is_admin());
