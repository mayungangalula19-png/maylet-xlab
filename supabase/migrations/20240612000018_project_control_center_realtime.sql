-- Enable Supabase Realtime for Project Control Center linked-asset sync
-- Idempotent: skips tables already in supabase_realtime publication

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'projects',
    'activities',
    'prototypes',
    'experiments',
    'validations',
    'funding_pitches',
    'documents'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
