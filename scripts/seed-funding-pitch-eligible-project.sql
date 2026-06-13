-- Seed a PASS validation so /funding/create unlocks pitch creation.
-- Run in Supabase SQL Editor AFTER you have at least one project.
-- Safe to re-run (updates existing PASS row or inserts one).

-- Ensure validations table exists (run scripts/create-validation-table.sql first if missing)

INSERT INTO public.validations (
  project_id,
  user_id,
  technical_score,
  user_score,
  market_score,
  financial_score,
  overall_score,
  decision,
  evidence,
  maya_insights,
  reviewer_notes,
  updated_at
)
SELECT
  p.id,
  p.user_id,
  82,
  78,
  80,
  75,
  79,
  'pass'::public.validation_decision,
  '{"seeded": true, "note": "Test PASS for funding pitch workspace"}'::jsonb,
  '[]'::jsonb,
  'Seeded via scripts/seed-funding-pitch-eligible-project.sql',
  NOW()
FROM public.projects p
WHERE p.id = (
  SELECT id FROM public.projects ORDER BY created_at DESC LIMIT 1
)
AND NOT EXISTS (
  SELECT 1 FROM public.validations v WHERE v.project_id = p.id
);

-- If a validation already exists for this project, force PASS
UPDATE public.validations v
SET
  decision = 'pass'::public.validation_decision,
  technical_score = GREATEST(technical_score, 82),
  user_score = GREATEST(user_score, 78),
  market_score = GREATEST(market_score, 80),
  financial_score = GREATEST(financial_score, 75),
  overall_score = GREATEST(overall_score, 79),
  updated_at = NOW()
WHERE v.project_id = (
  SELECT id FROM public.projects ORDER BY created_at DESC LIMIT 1
);

-- Option B: target a specific project (uncomment and set UUID)
-- UPDATE public.validations SET decision = 'pass', overall_score = 85, updated_at = NOW()
-- WHERE project_id = 'YOUR-PROJECT-UUID-HERE';

SELECT v.id, v.project_id, p.name, v.decision, v.overall_score, v.user_id
FROM public.validations v
JOIN public.projects p ON p.id = v.project_id
WHERE v.decision = 'pass'
ORDER BY v.updated_at DESC
LIMIT 5;
