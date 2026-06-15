-- Agent audit log for AI decision governance

CREATE TABLE IF NOT EXISTS public.agent_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  confidence NUMERIC(4, 3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_workspace ON public.agent_audit_log(workspace_id, created_at DESC);

ALTER TABLE public.agent_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_audit_service" ON public.agent_audit_log;
CREATE POLICY "agent_audit_service" ON public.agent_audit_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT ON public.agent_audit_log TO service_role;
