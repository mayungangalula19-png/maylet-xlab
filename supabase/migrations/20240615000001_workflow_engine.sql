-- Workflow Engine — Innovation lifecycle orchestration
-- IMPORTANT: ENUMs must be created before tables that reference them.

-- =============================================================================
-- 1. ENUMS (run first)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.workflow_status AS ENUM (
    'pending',
    'in_progress',
    'blocked',
    'under_review',
    'approved',
    'rejected',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.milestone_status AS ENUM (
    'not_started',
    'in_progress',
    'blocked',
    'completed',
    'overdue',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_decision AS ENUM (
    'pending',
    'approved',
    'conditional',
    'rejected',
    'expired',
    'withdrawn'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. STAGE & TRANSITION DEFINITIONS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_stages (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sequence_order INTEGER NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  module_route TEXT NOT NULL,
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
  min_readiness_to_exit INTEGER NOT NULL DEFAULT 80,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Repair partial installs (workflow_stages may exist from an earlier stub schema)
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

CREATE TABLE IF NOT EXISTS public.workflow_transitions (
  id TEXT PRIMARY KEY,
  from_stage_id TEXT NOT NULL REFERENCES public.workflow_stages(id),
  to_stage_id TEXT NOT NULL REFERENCES public.workflow_stages(id),
  label TEXT NOT NULL,
  description TEXT,
  requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
  approval_type TEXT,
  requirement_rules JSONB NOT NULL DEFAULT '[]',
  min_readiness_score INTEGER,
  auto_transition BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_roles TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (from_stage_id, to_stage_id)
);

-- Repair partial installs (workflow_transitions may exist from an earlier stub schema)
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

-- =============================================================================
-- 3. LIFECYCLE RECORD (system of record per project)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.innovation_lifecycle_records (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID,
  program_id UUID,

  current_stage_id TEXT NOT NULL REFERENCES public.workflow_stages(id) DEFAULT 'idea',
  previous_stage_id TEXT REFERENCES public.workflow_stages(id),
  workflow_status public.workflow_status NOT NULL DEFAULT 'pending',

  stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stage_completed_at TIMESTAMPTZ,

  overall_readiness_score INTEGER NOT NULL DEFAULT 0
    CHECK (overall_readiness_score BETWEEN 0 AND 100),

  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_reason TEXT,
  blocked_requirement_ids TEXT[] NOT NULL DEFAULT '{}',
  next_recommended_action TEXT,

  active_transition_id TEXT REFERENCES public.workflow_transitions(id),
  active_approval_id UUID,

  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Repair partial installs (table may exist without enum columns from an earlier failed run)
ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS workflow_status public.workflow_status NOT NULL DEFAULT 'pending';

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS program_id UUID;

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS previous_stage_id TEXT REFERENCES public.workflow_stages(id);

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS stage_completed_at TIMESTAMPTZ;

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS overall_readiness_score INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS blocked_requirement_ids TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS next_recommended_action TEXT;

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS active_transition_id TEXT REFERENCES public.workflow_transitions(id);

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS active_approval_id UUID;

ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_lifecycle_stage
  ON public.innovation_lifecycle_records(current_stage_id, workflow_status);

-- =============================================================================
-- 4. MILESTONES & DEPENDENCIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL REFERENCES public.workflow_stages(id),

  milestone_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  status public.milestone_status NOT NULL DEFAULT 'not_started',
  progress_pct INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),

  owner_id UUID REFERENCES auth.users(id),
  target_date DATE,
  completed_at TIMESTAMPTZ,

  depends_on UUID[] NOT NULL DEFAULT '{}',
  evaluator_key TEXT,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  weight INTEGER NOT NULL DEFAULT 10,

  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (project_id, milestone_key)
);

ALTER TABLE public.workflow_milestones
  ADD COLUMN IF NOT EXISTS status public.milestone_status NOT NULL DEFAULT 'not_started';

CREATE INDEX IF NOT EXISTS idx_milestones_project_stage
  ON public.workflow_milestones(project_id, stage_id);

CREATE TABLE IF NOT EXISTS public.workflow_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  dependent_type TEXT NOT NULL,
  dependent_id TEXT NOT NULL,
  depends_on_type TEXT NOT NULL,
  depends_on_id TEXT NOT NULL,

  is_satisfied BOOLEAN NOT NULL DEFAULT FALSE,
  satisfied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (project_id, dependent_type, dependent_id, depends_on_type, depends_on_id)
);

-- =============================================================================
-- 5. APPROVALS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL REFERENCES public.workflow_stages(id),
  transition_id TEXT REFERENCES public.workflow_transitions(id),

  approval_type TEXT NOT NULL,
  status public.approval_decision NOT NULL DEFAULT 'pending',

  requested_by UUID NOT NULL REFERENCES auth.users(id),
  approver_id UUID REFERENCES auth.users(id),
  approver_role TEXT NOT NULL,

  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  comments TEXT,
  conditions TEXT,
  payload JSONB NOT NULL DEFAULT '{}',

  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workflow_approvals
  ADD COLUMN IF NOT EXISTS status public.approval_decision NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_approvals_project
  ON public.workflow_approvals(project_id, approval_type);

CREATE INDEX IF NOT EXISTS idx_approvals_pending
  ON public.workflow_approvals(approver_role, status)
  WHERE status = 'pending';

-- Link lifecycle → active approval (after workflow_approvals exists)
DO $$ BEGIN
  ALTER TABLE public.innovation_lifecycle_records
    ADD CONSTRAINT innovation_lifecycle_records_active_approval_fkey
    FOREIGN KEY (active_approval_id) REFERENCES public.workflow_approvals(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 6. READINESS SCORES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_readiness_scores (
  project_id UUID PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,

  research_score INTEGER NOT NULL DEFAULT 0 CHECK (research_score BETWEEN 0 AND 100),
  prototype_score INTEGER NOT NULL DEFAULT 0 CHECK (prototype_score BETWEEN 0 AND 100),
  experiment_score INTEGER NOT NULL DEFAULT 0 CHECK (experiment_score BETWEEN 0 AND 100),
  validation_score INTEGER NOT NULL DEFAULT 0 CHECK (validation_score BETWEEN 0 AND 100),
  funding_score INTEGER NOT NULL DEFAULT 0 CHECK (funding_score BETWEEN 0 AND 100),
  commercialization_score INTEGER NOT NULL DEFAULT 0 CHECK (commercialization_score BETWEEN 0 AND 100),
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),

  score_breakdown JSONB NOT NULL DEFAULT '{}',
  blockers TEXT[] NOT NULL DEFAULT '{}',
  warnings TEXT[] NOT NULL DEFAULT '{}',

  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  computation_version TEXT NOT NULL DEFAULT '1.0.0'
);

-- =============================================================================
-- 7. AUDIT EVENTS (uses workflow_status enum — must come after enum creation)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID,

  event_type TEXT NOT NULL,

  from_stage TEXT,
  to_stage TEXT,
  from_status public.workflow_status,
  to_status public.workflow_status,

  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,

  approval_id UUID REFERENCES public.workflow_approvals(id),
  milestone_id UUID REFERENCES public.workflow_milestones(id),
  transition_id TEXT,

  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workflow_events
  ADD COLUMN IF NOT EXISTS from_status public.workflow_status;

ALTER TABLE public.workflow_events
  ADD COLUMN IF NOT EXISTS to_status public.workflow_status;

CREATE INDEX IF NOT EXISTS idx_events_project_time
  ON public.workflow_events(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_type
  ON public.workflow_events(event_type, created_at DESC);

-- =============================================================================
-- 8. SEED STAGES & TRANSITIONS
-- =============================================================================

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

INSERT INTO public.workflow_transitions (id, from_stage_id, to_stage_id, label, approval_type, requirement_rules, min_readiness_score)
VALUES
  ('T_IDEA_RESEARCH', 'idea', 'research', 'Start Research', NULL, '[]', NULL),
  ('T_RESEARCH_PROTOTYPE', 'research', 'prototype', 'Advance to Prototype', 'research_gate', '["R1","R2","R3","R4","R5"]', 80),
  ('T_PROTOTYPE_EXPERIMENT', 'prototype', 'experiment', 'Advance to Experiment', 'prototype_review', '["P1","P2","P3"]', 70),
  ('T_EXPERIMENT_VALIDATION', 'experiment', 'validation', 'Advance to Validation', 'experiment_review', '["E1","E2","E3"]', 70),
  ('T_VALIDATION_FUNDING', 'validation', 'funding', 'Advance to Funding', 'validation_pass', '["V1","V2","V3"]', 70),
  ('T_FUNDING_COMMERCIALIZATION', 'funding', 'commercialization', 'Advance to Commercialization', 'funding_ready', '["F1","F2","F3"]', 55),
  ('T_COMMERCIALIZATION_COMPLETED', 'commercialization', 'completed', 'Mark Completed', 'gtm_approval', '["C1","C2"]', 75)
ON CONFLICT (id) DO UPDATE SET
  from_stage_id = EXCLUDED.from_stage_id,
  to_stage_id = EXCLUDED.to_stage_id,
  label = EXCLUDED.label,
  approval_type = EXCLUDED.approval_type,
  requirement_rules = EXCLUDED.requirement_rules,
  min_readiness_score = EXCLUDED.min_readiness_score;

-- =============================================================================
-- 9. RLS
-- =============================================================================

ALTER TABLE public.workflow_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.innovation_lifecycle_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_readiness_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workflow_stages_read" ON public.workflow_stages;
CREATE POLICY "workflow_stages_read" ON public.workflow_stages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "workflow_transitions_read" ON public.workflow_transitions;
CREATE POLICY "workflow_transitions_read" ON public.workflow_transitions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lifecycle_project_access" ON public.innovation_lifecycle_records;
CREATE POLICY "lifecycle_project_access" ON public.innovation_lifecycle_records FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.teams t ON t.id = tm.team_id
      WHERE t.project_id = innovation_lifecycle_records.project_id
        AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "milestones_project_access" ON public.workflow_milestones;
CREATE POLICY "milestones_project_access" ON public.workflow_milestones FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "dependencies_project_access" ON public.workflow_dependencies;
CREATE POLICY "dependencies_project_access" ON public.workflow_dependencies FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "approvals_project_access" ON public.workflow_approvals;
CREATE POLICY "approvals_project_access" ON public.workflow_approvals FOR ALL TO authenticated
  USING (
    auth.uid() = requested_by
    OR auth.uid() = approver_id
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = requested_by
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "readiness_project_access" ON public.workflow_readiness_scores;
CREATE POLICY "readiness_project_access" ON public.workflow_readiness_scores FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "events_project_read" ON public.workflow_events;
CREATE POLICY "events_project_read" ON public.workflow_events FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.teams t ON t.id = tm.team_id
      WHERE t.project_id = workflow_events.project_id AND tm.user_id = auth.uid()
    )
  );

GRANT SELECT ON public.workflow_stages TO authenticated;
GRANT SELECT ON public.workflow_transitions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.innovation_lifecycle_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_milestones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_dependencies TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workflow_approvals TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workflow_readiness_scores TO authenticated;
GRANT SELECT ON public.workflow_events TO authenticated;

-- =============================================================================
-- 10. BACKFILL existing projects
-- =============================================================================

INSERT INTO public.innovation_lifecycle_records (project_id, current_stage_id, workflow_status)
SELECT p.id, 'research', 'in_progress'
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.innovation_lifecycle_records r WHERE r.project_id = p.id
);

INSERT INTO public.workflow_readiness_scores (project_id)
SELECT p.id
FROM public.projects p
WHERE NOT EXISTS (
  SELECT 1 FROM public.workflow_readiness_scores s WHERE s.project_id = p.id
);
