-- VALIDATION MODULE — copy ALL of this file, paste in Supabase SQL Editor, click RUN once.
-- Enables /validation, /validation/new, /validation/:id in the app.
-- Safe to re-run (uses IF NOT EXISTS / DROP POLICY IF EXISTS).

-- 1) Decision enum
DO $$ BEGIN
  CREATE TYPE public.validation_decision AS ENUM ('pass', 'hold', 'fail', 'pending');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Validations table
CREATE TABLE IF NOT EXISTS public.validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  technical_score INTEGER NOT NULL DEFAULT 0 CHECK (technical_score >= 0 AND technical_score <= 100),
  user_score INTEGER NOT NULL DEFAULT 0 CHECK (user_score >= 0 AND user_score <= 100),
  market_score INTEGER NOT NULL DEFAULT 0 CHECK (market_score >= 0 AND market_score <= 100),
  financial_score INTEGER NOT NULL DEFAULT 0 CHECK (financial_score >= 0 AND financial_score <= 100),
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  decision public.validation_decision NOT NULL DEFAULT 'pending',
  evidence JSONB NOT NULL DEFAULT '{}',
  maya_insights JSONB NOT NULL DEFAULT '[]',
  reviewer_notes TEXT,
  promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validations_project ON public.validations(project_id);
CREATE INDEX IF NOT EXISTS idx_validations_user ON public.validations(user_id);
CREATE INDEX IF NOT EXISTS idx_validations_decision ON public.validations(decision);

-- 3) RLS — users only see their own validations
ALTER TABLE public.validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "validations_owner" ON public.validations;
CREATE POLICY "validations_owner" ON public.validations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.validations TO authenticated;
