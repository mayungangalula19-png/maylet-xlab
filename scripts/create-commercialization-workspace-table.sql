-- Commercialization workspace — run once in Supabase SQL Editor.
-- Persists /commercialization market strategy, packaging, revenue, and launch state.
-- Safe to re-run.

DO $$ BEGIN
  CREATE TYPE public.commercialization_launch_status AS ENUM (
    'draft', 'preparing', 'scheduled', 'launched'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.commercialization_revenue_model AS ENUM (
    'saas', 'subscription', 'licensing', 'api'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.commercialization_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  market_strategy JSONB NOT NULL DEFAULT '{}',
  product_packaging JSONB NOT NULL DEFAULT '{}',
  revenue_model public.commercialization_revenue_model NOT NULL DEFAULT 'saas',
  maya_insights JSONB NOT NULL DEFAULT '{}',
  launch_status public.commercialization_launch_status NOT NULL DEFAULT 'draft',
  launch_checklist JSONB NOT NULL DEFAULT '{}',
  launched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id)
);

CREATE INDEX IF NOT EXISTS idx_comm_workspaces_user ON public.commercialization_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_comm_workspaces_launch ON public.commercialization_workspaces(launch_status);

ALTER TABLE public.commercialization_workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comm_workspaces_select" ON public.commercialization_workspaces;
CREATE POLICY "comm_workspaces_select" ON public.commercialization_workspaces
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comm_workspaces_insert" ON public.commercialization_workspaces;
CREATE POLICY "comm_workspaces_insert" ON public.commercialization_workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comm_workspaces_update" ON public.commercialization_workspaces;
CREATE POLICY "comm_workspaces_update" ON public.commercialization_workspaces
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_admin()
  );

GRANT SELECT, INSERT, UPDATE ON public.commercialization_workspaces TO authenticated;
