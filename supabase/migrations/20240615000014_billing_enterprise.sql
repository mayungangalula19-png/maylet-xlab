-- Enterprise billing: multi-tenant orgs, subscriptions, invoices, usage, audit

DO $$ BEGIN
  CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM (
    'active', 'trialing', 'past_due', 'canceled', 'incomplete'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('draft', 'pending', 'paid', 'failed', 'void');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Plan catalog
CREATE TABLE IF NOT EXISTS public.billing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly NUMERIC(14, 2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  limits JSONB NOT NULL DEFAULT '{}',
  features JSONB NOT NULL DEFAULT '[]',
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.billing_plans (id, name, price_monthly, price_yearly, limits, features, sort_order)
VALUES
  (
    'free',
    'Free',
    0,
    0,
    '{"projects": 3, "users": 5, "storage_gb": 1, "workflow_runs": 50, "api_calls": 1000}'::jsonb,
    '["3 projects","5 team members","Basic AI","Community support"]'::jsonb,
    1
  ),
  (
    'pro',
    'Pro',
    49,
    470,
    '{"projects": -1, "users": 25, "storage_gb": 50, "workflow_runs": 5000, "api_calls": 100000}'::jsonb,
    '["Unlimited projects","25 users","Advanced AI","Funding Hub","Priority support"]'::jsonb,
    2
  ),
  (
    'enterprise',
    'Enterprise',
    199,
    1990,
    '{"projects": -1, "users": -1, "storage_gb": 500, "workflow_runs": -1, "api_calls": -1}'::jsonb,
    '["Everything in Pro","SSO","Admin controls","Dedicated manager","API access"]'::jsonb,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  limits = EXCLUDED.limits,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order;

-- Tenant organizations (billing isolation boundary)
CREATE TABLE IF NOT EXISTS public.billing_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_organizations_owner ON public.billing_organizations(owner_id);

CREATE TABLE IF NOT EXISTS public.billing_organization_members (
  organization_id UUID NOT NULL REFERENCES public.billing_organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'billing_admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_org_members_user ON public.billing_organization_members(user_id);

-- Active subscription per organization
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.billing_organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.billing_plans(id) DEFAULT 'free',
  billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
  status public.subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.billing_organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  plan_id TEXT REFERENCES public.billing_plans(id),
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.invoice_status NOT NULL DEFAULT 'pending',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  pdf_url TEXT,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  UNIQUE (organization_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_org ON public.billing_invoices(organization_id);

CREATE TABLE IF NOT EXISTS public.billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.billing_organizations(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.billing_invoices(id) ON DELETE SET NULL,
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.payment_status NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.billing_organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'card',
  last4 TEXT,
  brand TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_payment_method_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_usage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.billing_organizations(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  metric_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, metric_key, period_start)
);

CREATE TABLE IF NOT EXISTS public.billing_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.billing_organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpers
CREATE OR REPLACE FUNCTION public.is_billing_org_member(p_org_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.billing_organization_members m
    WHERE m.organization_id = p_org_id AND m.user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.billing_organizations o
    WHERE o.id = p_org_id AND o.owner_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_billing_admin(p_org_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.billing_organizations o
    WHERE o.id = p_org_id AND o.owner_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.billing_organization_members m
    WHERE m.organization_id = p_org_id
      AND m.user_id = p_user_id
      AND m.role IN ('owner', 'admin', 'billing_admin')
  )
  OR public.is_admin();
$$;

GRANT EXECUTE ON FUNCTION public.is_billing_org_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_billing_admin(UUID, UUID) TO authenticated;

-- RLS
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_usage_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "billing_plans_read" ON public.billing_plans;
CREATE POLICY "billing_plans_read" ON public.billing_plans FOR SELECT TO authenticated USING (is_active = TRUE);

DROP POLICY IF EXISTS "billing_orgs_member" ON public.billing_organizations;
CREATE POLICY "billing_orgs_member" ON public.billing_organizations FOR SELECT TO authenticated
  USING (public.is_billing_org_member(id) OR public.is_admin());
CREATE POLICY "billing_orgs_insert" ON public.billing_organizations FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "billing_orgs_update" ON public.billing_organizations FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "billing_org_members_access" ON public.billing_organization_members;
CREATE POLICY "billing_org_members_access" ON public.billing_organization_members FOR ALL TO authenticated
  USING (public.is_billing_org_member(organization_id))
  WITH CHECK (public.is_billing_admin(organization_id));

DROP POLICY IF EXISTS "org_subscriptions_access" ON public.organization_subscriptions;
CREATE POLICY "org_subscriptions_access" ON public.organization_subscriptions FOR ALL TO authenticated
  USING (public.is_billing_org_member(organization_id))
  WITH CHECK (public.is_billing_admin(organization_id));

DROP POLICY IF EXISTS "billing_invoices_access" ON public.billing_invoices;
CREATE POLICY "billing_invoices_access" ON public.billing_invoices FOR ALL TO authenticated
  USING (public.is_billing_org_member(organization_id))
  WITH CHECK (public.is_billing_admin(organization_id));

DROP POLICY IF EXISTS "billing_payments_access" ON public.billing_payments;
CREATE POLICY "billing_payments_access" ON public.billing_payments FOR SELECT TO authenticated
  USING (public.is_billing_org_member(organization_id));

DROP POLICY IF EXISTS "billing_payment_methods_access" ON public.billing_payment_methods;
CREATE POLICY "billing_payment_methods_access" ON public.billing_payment_methods FOR ALL TO authenticated
  USING (public.is_billing_org_member(organization_id))
  WITH CHECK (public.is_billing_admin(organization_id));

DROP POLICY IF EXISTS "billing_usage_access" ON public.billing_usage_snapshots;
CREATE POLICY "billing_usage_access" ON public.billing_usage_snapshots FOR SELECT TO authenticated
  USING (public.is_billing_org_member(organization_id));

DROP POLICY IF EXISTS "billing_audit_access" ON public.billing_audit_logs;
CREATE POLICY "billing_audit_access" ON public.billing_audit_logs FOR SELECT TO authenticated
  USING (public.is_billing_org_member(organization_id) OR public.is_admin());

GRANT SELECT ON public.billing_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organization_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.billing_invoices TO authenticated;
GRANT SELECT ON public.billing_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_payment_methods TO authenticated;
GRANT SELECT ON public.billing_usage_snapshots TO authenticated;
GRANT SELECT ON public.billing_audit_logs TO authenticated;

NOTIFY pgrst, 'reload schema';
