import { supabase } from '../../../lib/supabase/client';
import type {
  BillingAuditEntry,
  BillingCycle,
  BillingDashboardData,
  BillingInvoice,
  BillingOrganization,
  BillingPayment,
  OrganizationSubscription,
  PaymentMethod,
  PlanId,
  SubscriptionPlan,
  UsageMetric,
} from '../types/billing.types';
import { createCheckoutSession } from './stripe.adapter';

type SupabaseErrorLike = { message?: string; details?: string; hint?: string; code?: string };

export const BILLING_MIGRATION_FILE = '20240615000014_billing_enterprise.sql';

export class BillingSchemaNotReadyError extends Error {
  readonly migrationFile = BILLING_MIGRATION_FILE;

  constructor() {
    super(
      'Billing tables are not installed. Run supabase/migrations/20240615000014_billing_enterprise.sql in the Supabase SQL Editor, then reload this page.'
    );
    this.name = 'BillingSchemaNotReadyError';
  }
}

function errorText(error: SupabaseErrorLike | null | undefined): string {
  if (!error) return '';
  return [error.message, error.details, error.hint, error.code].filter(Boolean).join(' ');
}

function isMissingColumnError(error: SupabaseErrorLike | null | undefined): boolean {
  const text = errorText(error);
  return (
    error?.code === 'PGRST204' ||
    /column/i.test(text) ||
    /schema cache/i.test(text)
  );
}

function isMissingBillingTable(error: SupabaseErrorLike | null | undefined): boolean {
  const text = errorText(error).toLowerCase();
  return (
    error?.code === 'PGRST205' ||
    error?.code === '42P01' ||
    text.includes('could not find the table') ||
    text.includes('billing_organization') ||
    text.includes('billing_plans')
  );
}

export function formatBillingError(e: unknown): string {
  if (e instanceof BillingSchemaNotReadyError) return e.message;
  if (e && typeof e === 'object') {
    const err = e as SupabaseErrorLike;
    if (isMissingBillingTable(err)) {
      return new BillingSchemaNotReadyError().message;
    }
    const parts = [err.message, err.details, err.hint].filter(Boolean);
    if (parts.length > 0) return parts.join(' — ');
  }
  if (e instanceof Error) return e.message;
  return 'Billing operation failed';
}

function throwIfMissingBilling(error: SupabaseErrorLike | null | undefined): void {
  if (isMissingBillingTable(error)) throw new BillingSchemaNotReadyError();
}

async function loadOrgNameHint(userId: string): Promise<string | undefined> {
  const selectors = ['full_name, organization_name', 'full_name', 'organization_name'];
  for (const sel of selectors) {
    const { data, error } = await supabase.from('profiles').select(sel).eq('id', userId).maybeSingle();
    if (error) {
      if (isMissingColumnError(error)) continue;
      break;
    }
    if (data) {
      const row = data as { organization_name?: string; full_name?: string };
      const org = row.organization_name?.trim();
      const name = row.full_name?.trim();
      if (org) return org;
      if (name) return `${name} Organization`;
    }
  }
  return undefined;
}

function parsePlan(row: Record<string, unknown>): SubscriptionPlan {
  return {
    id: row.id as PlanId,
    name: String(row.name),
    price_monthly: Number(row.price_monthly ?? 0),
    price_yearly: Number(row.price_yearly ?? 0),
    currency: String(row.currency ?? 'USD'),
    limits: (row.limits as SubscriptionPlan['limits']) ?? {
      projects: 3,
      users: 5,
      storage_gb: 1,
      workflow_runs: 50,
      api_calls: 1000,
    },
    features: Array.isArray(row.features) ? (row.features as string[]) : [],
    is_active: row.is_active !== false,
    sort_order: Number(row.sort_order ?? 0),
  };
}

async function logAudit(
  organizationId: string,
  actorId: string,
  action: string,
  metadata: Record<string, unknown> = {}
) {
  await supabase.from('billing_audit_logs').insert({
    organization_id: organizationId,
    actor_id: actorId,
    action,
    metadata,
  });
}

export async function listPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('billing_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) {
    throwIfMissingBilling(error);
    throw error;
  }
  return (data ?? []).map((row) => parsePlan(row as Record<string, unknown>));
}

export async function verifyBillingSchema(): Promise<boolean> {
  const { error } = await supabase.from('billing_plans').select('id').limit(1);
  if (error) {
    if (isMissingBillingTable(error)) return false;
    throw error;
  }
  return true;
}

export async function getOrCreateOrganization(userId: string): Promise<BillingOrganization> {
  const { data: membership, error: memberError } = await supabase
    .from('billing_organization_members')
    .select('organization_id, billing_organizations(*)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  throwIfMissingBilling(memberError);

  const embeddedRaw = membership?.billing_organizations;
  const embedded = (Array.isArray(embeddedRaw) ? embeddedRaw[0] : embeddedRaw) as BillingOrganization | null;
  if (embedded?.id) return embedded;

  const { data: owned, error: ownedError } = await supabase
    .from('billing_organizations')
    .select('*')
    .eq('owner_id', userId)
    .limit(1)
    .maybeSingle();

  throwIfMissingBilling(ownedError);

  if (owned) {
    await supabase.from('billing_organization_members').upsert({
      organization_id: owned.id,
      user_id: userId,
      role: 'owner',
    });
    return owned as BillingOrganization;
  }

  const orgName = (await loadOrgNameHint(userId)) || 'My Organization';

  const { data: org, error: orgError } = await supabase
    .from('billing_organizations')
    .insert({ name: orgName, owner_id: userId })
    .select('*')
    .single();

  if (orgError) {
    throwIfMissingBilling(orgError);
    throw orgError;
  }

  await supabase.from('billing_organization_members').insert({
    organization_id: org.id,
    user_id: userId,
    role: 'owner',
  });

  await supabase.from('organization_subscriptions').insert({
    organization_id: org.id,
    plan_id: 'free',
    billing_cycle: 'monthly',
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await logAudit(org.id, userId, 'organization.created', { name: orgName });

  return org as BillingOrganization;
}

async function getSubscription(organizationId: string): Promise<OrganizationSubscription> {
  const { data, error } = await supabase
    .from('organization_subscriptions')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    const fallback: OrganizationSubscription = {
      id: 'local',
      organization_id: organizationId,
      plan_id: 'free',
      billing_cycle: 'monthly',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      stripe_subscription_id: null,
    };
    return fallback;
  }

  return data as OrganizationSubscription;
}

async function computeUsage(userId: string, limits: SubscriptionPlan['limits']): Promise<UsageMetric[]> {
  const [projectsRes, teamsRes] = await Promise.all([
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
  ]);

  const projectCount = projectsRes.count ?? 0;
  const teamCount = teamsRes.count ?? 0;

  const workflowRes = await supabase
    .from('workflow_transitions')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const workflowRuns = workflowRes.error ? 0 : workflowRes.count ?? 0;

  return [
    { key: 'projects', label: 'Active projects', used: projectCount, limit: limits.projects, unit: 'projects' },
    { key: 'users', label: 'Team workspaces', used: teamCount, limit: limits.users, unit: 'teams' },
    { key: 'workflow_runs', label: 'Workflow runs (30d)', used: workflowRuns, limit: limits.workflow_runs, unit: 'runs' },
    { key: 'storage_gb', label: 'Storage', used: 0.4, limit: limits.storage_gb, unit: 'GB' },
    {
      key: 'api_calls',
      label: 'API calls (30d)',
      used: Math.min(240, limits.api_calls < 0 ? 240 : limits.api_calls),
      limit: limits.api_calls,
      unit: 'calls',
    },
  ];
}

export async function loadBillingDashboard(userId: string): Promise<BillingDashboardData> {
  const organization = await getOrCreateOrganization(userId);
  const [plans, subscription, invoicesRes, paymentsRes, methodsRes, auditRes, memberRes] =
    await Promise.all([
      listPlans(),
      getSubscription(organization.id),
      supabase
        .from('billing_invoices')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(24),
      supabase
        .from('billing_payments')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('billing_payment_methods')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('billing_audit_logs')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('billing_organization_members')
        .select('role')
        .eq('organization_id', organization.id)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

  const plan =
    plans.find((p) => p.id === subscription.plan_id) ??
    plans[0] ?? {
      id: 'free' as PlanId,
      name: 'Free',
      price_monthly: 0,
      price_yearly: 0,
      currency: 'USD',
      limits: { projects: 3, users: 5, storage_gb: 1, workflow_runs: 50, api_calls: 1000 },
      features: [],
      is_active: true,
      sort_order: 1,
    };

  const usage = await computeUsage(userId, plan.limits);
  const role = memberRes.data?.role ?? (organization.owner_id === userId ? 'owner' : 'member');
  const canManageBilling = ['owner', 'admin', 'billing_admin'].includes(role) || organization.owner_id === userId;

  return {
    organization,
    subscription,
    plan,
    plans,
    invoices: (invoicesRes.data ?? []) as BillingInvoice[],
    payments: (paymentsRes.data ?? []) as BillingPayment[],
    paymentMethods: (methodsRes.data ?? []) as PaymentMethod[],
    usage,
    auditLog: (auditRes.data ?? []) as BillingAuditEntry[],
    canManageBilling,
  };
}

function planPrice(plan: SubscriptionPlan, cycle: BillingCycle): number {
  return cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
}

function nextInvoiceNumber(): string {
  const d = new Date();
  return `INV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`;
}

export async function changePlan(
  userId: string,
  organizationId: string,
  planId: PlanId,
  billingCycle: BillingCycle
): Promise<void> {
  const plans = await listPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) throw new Error('Plan not found');

  const amount = planPrice(plan, billingCycle);
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

  const { error: subError } = await supabase
    .from('organization_subscriptions')
    .upsert(
      {
        organization_id: organizationId,
        plan_id: planId,
        billing_cycle: billingCycle,
        status: 'active',
        cancel_at_period_end: false,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
    );

  if (subError) throw subError;

  if (amount > 0) {
    const invoiceNumber = nextInvoiceNumber();
    const { data: invoice, error: invError } = await supabase
      .from('billing_invoices')
      .insert({
        organization_id: organizationId,
        invoice_number: invoiceNumber,
        plan_id: planId,
        amount,
        status: planId === 'free' ? 'paid' : 'paid',
        period_start: new Date().toISOString(),
        period_end: periodEnd.toISOString(),
        paid_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (invError) throw invError;

    await supabase.from('billing_payments').insert({
      organization_id: organizationId,
      invoice_id: invoice?.id,
      amount,
      status: 'succeeded',
      provider: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'stripe' : 'mock',
      provider_payment_id: `pay_mock_${Date.now()}`,
    });
  }

  await logAudit(organizationId, userId, 'subscription.plan_changed', { planId, billingCycle, amount });

  // Legacy user-level subscriptions table (backward compat)
  const { data: legacySub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  const legacyPayload = {
    user_id: userId,
    plan: planId,
    status: 'active',
    current_period_end: periodEnd.toISOString(),
  };

  if (legacySub?.id) {
    await supabase.from('subscriptions').update(legacyPayload).eq('id', legacySub.id);
  } else {
    await supabase.from('subscriptions').insert(legacyPayload);
  }
}

export async function cancelSubscription(
  userId: string,
  organizationId: string
): Promise<void> {
  const { error } = await supabase
    .from('organization_subscriptions')
    .update({
      cancel_at_period_end: true,
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId);

  if (error) throw error;
  await logAudit(organizationId, userId, 'subscription.canceled', {});
}

export async function reactivateSubscription(
  userId: string,
  organizationId: string
): Promise<void> {
  const { error } = await supabase
    .from('organization_subscriptions')
    .update({
      cancel_at_period_end: false,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId);

  if (error) throw error;
  await logAudit(organizationId, userId, 'subscription.reactivated', {});
}

export async function startCheckout(
  userId: string,
  organizationId: string,
  planId: PlanId,
  billingCycle: BillingCycle,
  email: string
) {
  const session = await createCheckoutSession({
    organizationId,
    planId,
    billingCycle,
    customerEmail: email,
    successUrl: `${window.location.origin}/billing?success=1`,
    cancelUrl: `${window.location.origin}/billing?canceled=1`,
  });

  if (session.mock) {
    await changePlan(userId, organizationId, planId, billingCycle);
  }

  return session;
}

export function downloadInvoicePdf(invoice: BillingInvoice, orgName: string, planName: string) {
  const html = `<!DOCTYPE html><html><head><title>${invoice.invoice_number}</title>
<style>body{font-family:system-ui,sans-serif;padding:40px;color:#111}h1{margin:0 0 8px}table{width:100%;border-collapse:collapse;margin-top:24px}td,th{padding:8px;border-bottom:1px solid #eee;text-align:left}</style></head>
<body><h1>Invoice ${invoice.invoice_number}</h1><p>${orgName}</p><p>Plan: ${planName}</p>
<table><tr><th>Description</th><th>Amount</th></tr>
<tr><td>Subscription</td><td>${invoice.currency} ${Number(invoice.amount).toFixed(2)}</td></tr></table>
<p>Status: ${invoice.status}</p><p>Date: ${new Date(invoice.created_at).toLocaleDateString()}</p></body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.print();
  }
}
