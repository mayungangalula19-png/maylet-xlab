-- Hotfix: repair workflow_stages missing columns (partial install)
-- Run before re-running the main workflow_engine migration seed section.

ALTER TABLE public.workflow_stages
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.workflow_stages
  ADD COLUMN IF NOT EXISTS icon TEXT;

ALTER TABLE public.workflow_stages
  ADD COLUMN IF NOT EXISTS color TEXT;

ALTER TABLE public.workflow_stages
  ADD COLUMN IF NOT EXISTS module_route TEXT;

ALTER TABLE public.workflow_stages
  ADD COLUMN IF NOT EXISTS is_terminal BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.workflow_stages
  ADD COLUMN IF NOT EXISTS min_readiness_to_exit INTEGER NOT NULL DEFAULT 80;

ALTER TABLE public.workflow_stages
  ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}';

ALTER TABLE public.workflow_stages
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.workflow_transitions
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.workflow_transitions
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.workflow_transitions
  ADD COLUMN IF NOT EXISTS approval_type TEXT;

ALTER TABLE public.workflow_transitions
  ADD COLUMN IF NOT EXISTS requirement_rules JSONB NOT NULL DEFAULT '[]';

ALTER TABLE public.workflow_transitions
  ADD COLUMN IF NOT EXISTS min_readiness_score INTEGER;

ALTER TABLE public.workflow_transitions
  ADD COLUMN IF NOT EXISTS auto_transition BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.workflow_transitions
  ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.workflow_transitions
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

INSERT INTO public.workflow_stages (id, label, sequence_order, module_route, is_terminal, min_readiness_to_exit)
VALUES
  ('idea', 'Idea', 0, '/projects/:id', FALSE, 0),
  ('research', 'Research', 1, '/research/:projectId', FALSE, 80),
  ('prototype', 'Prototype', 2, '/prototypes', FALSE, 75),
  ('experiment', 'Experiment', 3, '/experiments', FALSE, 70),
  ('validation', 'Validation', 4, '/validation', FALSE, 70),
  ('funding', 'Funding', 5, '/funding', FALSE, 55),
  ('commercialization', 'Commercialization', 6, '/commercialization', FALSE, 75),
  ('completed', 'Completed', 7, '/projects/:id', TRUE, 100),
  ('archived', 'Archived', 8, '/projects/:id', TRUE, 0)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  sequence_order = EXCLUDED.sequence_order,
  module_route = EXCLUDED.module_route,
  is_terminal = EXCLUDED.is_terminal,
  min_readiness_to_exit = EXCLUDED.min_readiness_to_exit;
