export type PlanId = 'free' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'failed' | 'void';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface PlanLimits {
  projects: number;
  users: number;
  storage_gb: number;
  workflow_runs: number;
  api_calls: number;
}

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  limits: PlanLimits;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface BillingOrganization {
  id: string;
  name: string;
  owner_id: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  plan_id: PlanId;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
}

export interface BillingInvoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  plan_id: PlanId | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  period_start: string | null;
  period_end: string | null;
  pdf_url: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface BillingPayment {
  id: string;
  organization_id: string;
  invoice_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  organization_id: string;
  type: string;
  last4: string | null;
  brand: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
}

export interface UsageMetric {
  key: string;
  label: string;
  used: number;
  limit: number;
  unit: string;
}

export interface BillingAuditEntry {
  id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BillingDashboardData {
  organization: BillingOrganization;
  subscription: OrganizationSubscription;
  plan: SubscriptionPlan;
  plans: SubscriptionPlan[];
  invoices: BillingInvoice[];
  payments: BillingPayment[];
  paymentMethods: PaymentMethod[];
  usage: UsageMetric[];
  auditLog: BillingAuditEntry[];
  canManageBilling: boolean;
}
