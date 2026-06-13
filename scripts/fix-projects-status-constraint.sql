-- Fix projects status constraint errors (e.g. seed script fails on "prototype")
-- Run once in Supabase SQL Editor. Safe to re-run.

ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM (
    'idea', 'experiment', 'prototype', 'launched', 'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- If status column is TEXT, normalize to enum (skip if already enum)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'status'
      AND udt_name = 'text'
  ) THEN
    ALTER TABLE public.projects
      ALTER COLUMN status TYPE public.project_status
      USING (
        CASE lower(trim(status::text))
          WHEN 'idea' THEN 'idea'::public.project_status
          WHEN 'experiment' THEN 'experiment'::public.project_status
          WHEN 'prototype' THEN 'prototype'::public.project_status
          WHEN 'launched' THEN 'launched'::public.project_status
          WHEN 'archived' THEN 'archived'::public.project_status
          ELSE 'idea'::public.project_status
        END
      );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'status column already enum or conversion skipped: %', SQLERRM;
END $$;
