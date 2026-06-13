-- Make a project appear on /commercialization (eligible list)
-- Run in Supabase SQL Editor AFTER you have at least one project.
-- Safe to re-run.

-- Fix: remove legacy CHECK that blocks lowercase enum values (e.g. "prototype")
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Ensure project_status enum exists (Supabase / app uses lowercase values)
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM (
    'idea', 'experiment', 'prototype', 'launched', 'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Option A: bump your most recently created project
UPDATE public.projects
SET
  status = 'prototype'::public.project_status,
  progress = 88,
  progress_score = 88,
  updated_at = NOW()
WHERE id = (
  SELECT id FROM public.projects
  ORDER BY created_at DESC
  LIMIT 1
);

-- Option B: target a specific project (uncomment and set UUID)
-- UPDATE public.projects
-- SET
--   status = 'prototype'::public.project_status,
--   progress = 88,
--   progress_score = 88,
--   updated_at = NOW()
-- WHERE id = 'YOUR-PROJECT-UUID-HERE';

-- If UPDATE still fails, use launched (always valid for commercialization):
-- UPDATE public.projects
-- SET status = 'launched'::public.project_status, progress = 100, progress_score = 100, updated_at = NOW()
-- WHERE id = (SELECT id FROM public.projects ORDER BY created_at DESC LIMIT 1);

-- Why this works:
-- progress 88 + status prototype → innovation stage "Funding"
-- funding readiness ≥ 55 → "Committed" or "Secured"
-- validation gate passes → project shows on Commercialization page

SELECT id, name, status, progress, user_id
FROM public.projects
ORDER BY updated_at DESC
LIMIT 5;
