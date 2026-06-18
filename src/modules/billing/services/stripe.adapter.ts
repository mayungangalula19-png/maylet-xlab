import type { BillingCycle, PlanId } from '../types/billing.types';

export interface CheckoutSessionRequest {
  organizationId: string;
  planId: PlanId;
  billingCycle: BillingCycle;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  mock: boolean;
}

/**
 * Stripe-ready adapter. Replace internals with Stripe Checkout / Billing Portal when keys are configured.
 */
export async function createCheckoutSession(
  req: CheckoutSessionRequest
): Promise<CheckoutSessionResult> {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (stripeKey) {
    // Production: POST to your API route or Supabase Edge Function that calls Stripe
    return {
      sessionId: `cs_live_pending_${req.planId}`,
      url: `/billing?checkout=pending&plan=${req.planId}`,
      mock: false,
    };
  }

  return {
    sessionId: `cs_mock_${req.organizationId}_${req.planId}`,
    url: `/billing?mock_checkout=1&plan=${req.planId}&cycle=${req.billingCycle}`,
    mock: true,
  };
}

export async function createBillingPortalSession(organizationId: string): Promise<string> {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (stripeKey) {
    return `/billing?portal=pending&org=${organizationId}`;
  }
  return `/billing?mock_portal=1&org=${organizationId}`;
}
