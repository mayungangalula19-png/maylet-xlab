-- Project control center: persistent workspace metadata on parent project record
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.projects.metadata IS
  'Innovation OS workspace: tagline, category, tags, problem_statement, innovation_goals, target_users, pending_invites, maya_snapshot';

CREATE INDEX IF NOT EXISTS idx_projects_metadata ON public.projects USING gin (metadata);

-- Ownership must be preserved on UPDATE (required for JSONB metadata writes under RLS)
DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
