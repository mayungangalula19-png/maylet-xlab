-- Run in Supabase SQL Editor for Investment Operations Command Center

DO $$ BEGIN
  CREATE TYPE public.investor_deal_stage AS ENUM (
    'lead', 'contacted', 'negotiation', 'committed', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.investor_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES public.investors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  stage public.investor_deal_stage NOT NULL DEFAULT 'lead',
  probability_score INTEGER NOT NULL DEFAULT 10 CHECK (probability_score >= 0 AND probability_score <= 100),
  expected_close_date DATE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investor_deals_investor ON public.investor_deals(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_deals_stage ON public.investor_deals(stage);

ALTER TABLE public.investors
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.investor_deals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "investor_deals_admin_all" ON public.investor_deals;
CREATE POLICY "investor_deals_admin_all" ON public.investor_deals
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investor_deals TO authenticated;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'investor_deals'
ORDER BY ordinal_position;
