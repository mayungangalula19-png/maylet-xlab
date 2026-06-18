-- Hotfix: repair partial workflow_engine install (column "workflow_status" does not exist)
-- Run this in Supabase SQL Editor if the main migration failed partway.

DO $$ BEGIN
  CREATE TYPE public.workflow_status AS ENUM (
    'pending', 'in_progress', 'blocked', 'under_review',
    'approved', 'rejected', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.milestone_status AS ENUM (
    'not_started', 'in_progress', 'blocked', 'completed', 'overdue', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.approval_decision AS ENUM (
    'pending', 'approved', 'conditional', 'rejected', 'expired', 'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add missing enum columns on tables that may have been created in a partial run
ALTER TABLE public.innovation_lifecycle_records
  ADD COLUMN IF NOT EXISTS workflow_status public.workflow_status NOT NULL DEFAULT 'pending';

ALTER TABLE public.workflow_milestones
  ADD COLUMN IF NOT EXISTS status public.milestone_status NOT NULL DEFAULT 'not_started';

ALTER TABLE public.workflow_approvals
  ADD COLUMN IF NOT EXISTS status public.approval_decision NOT NULL DEFAULT 'pending';

ALTER TABLE public.workflow_events
  ADD COLUMN IF NOT EXISTS from_status public.workflow_status;

ALTER TABLE public.workflow_events
  ADD COLUMN IF NOT EXISTS to_status public.workflow_status;

CREATE INDEX IF NOT EXISTS idx_lifecycle_stage
  ON public.innovation_lifecycle_records(current_stage_id, workflow_status);
