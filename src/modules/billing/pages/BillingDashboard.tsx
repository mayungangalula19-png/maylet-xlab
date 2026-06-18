import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InvoiceTable } from '../components/InvoiceTable';
import { PricingCards } from '../components/PricingCards';
import { UsageMetrics } from '../components/UsageMetrics';
import { useBilling } from '../hooks/useBilling';
import { BILLING_MIGRATION_FILE } from '../services/billing.service';
import type { BillingCycle, PlanId } from '../types/billing.types';
import '../billing.css';

export default function BillingDashboard() {
  const { data, loading, error, schemaNotReady, actionLoading, upgradePlan, cancel, reactivate, refresh } =
    useBilling();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [searchParams, setSearchParams] = useSearchParams();

  const flash = useMemo(() => {
    if (searchParams.get('success')) return 'Plan updated successfully.';
    if (searchParams.get('canceled')) return 'Checkout canceled — no changes were made.';
    return null;
  }, [searchParams]);

  const clearFlash = () => {
    searchParams.delete('success');
    searchParams.delete('canceled');
    setSearchParams(searchParams, { replace: true });
  };

  if (loading) {
    return <div className="billing-page billing-loading">Loading billing…</div>;
  }

  if (schemaNotReady) {
    return (
      <div className="billing-page">
        <header className="billing-header">
          <div>
            <h1>Billing</h1>
            <p>Database setup required before billing can load.</p>
          </div>
        </header>
        <div className="billing-card billing-setup-card">
          <h2>Install billing schema</h2>
          <p className="billing-muted">
            Your Supabase project does not have the billing tables yet. PostgREST returns 404 for{' '}
            <code>billing_organizations</code> until the migration runs.
          </p>
          <ol className="billing-setup-steps">
            <li>Open Supabase Dashboard → SQL Editor</li>
            <li>
              Paste and run the full contents of{' '}
              <code>supabase/migrations/{BILLING_MIGRATION_FILE}</code>
            </li>
            <li>Wait for success, then click Refresh below</li>
          </ol>
          <div className="billing-actions">
            <button type="button" className="billing-btn billing-btn-primary" onClick={() => void refresh()}>
              Refresh billing
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="billing-page">
        <div className="billing-alert billing-alert--error">Sign in to manage billing.</div>
      </div>
    );
  }

  const { organization, subscription, plan, plans, invoices, payments, paymentMethods, usage, auditLog, canManageBilling } =
    data;

  const periodEnd = new Date(subscription.current_period_end).toLocaleDateString();
  const isCanceled = subscription.status === 'canceled' || subscription.cancel_at_period_end;

  const handleSelectPlan = (planId: PlanId) => {
    if (!canManageBilling) return;
    void upgradePlan(planId, billingCycle);
  };

  return (
    <div className="billing-page">
      <header className="billing-header">
        <div>
          <h1>Billing</h1>
          <p>Subscriptions, invoices, and usage for your organization.</p>
        </div>
        <span className="billing-org-pill">{organization.name}</span>
      </header>

      {!canManageBilling ? (
        <div className="billing-readonly-banner">
          You have read-only access. Contact an organization admin to change plans or payment methods.
        </div>
      ) : null}

      {flash ? (
        <div className="billing-alert billing-alert--success" role="status">
          {flash}{' '}
          <button type="button" className="billing-link-btn" onClick={clearFlash}>
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? <div className="billing-alert billing-alert--error">{error}</div> : null}

      <div className="billing-grid billing-grid--2">
        <section className="billing-card">
          <h2>Current subscription</h2>
          <div className="billing-plan-summary">
            <span className="billing-plan-name">{plan.name}</span>
            <div className="billing-plan-meta">
              <span className={`billing-status billing-status--${subscription.status}`}>{subscription.status}</span>
              <span>
                {subscription.billing_cycle} · renews {periodEnd}
              </span>
            </div>
            {isCanceled ? (
              <p className="billing-muted">Cancellation scheduled — access continues until {periodEnd}.</p>
            ) : null}
            {canManageBilling ? (
              <div className="billing-actions">
                {isCanceled ? (
                  <button
                    type="button"
                    className="billing-btn billing-btn-primary"
                    disabled={actionLoading}
                    onClick={() => void reactivate()}
                  >
                    Reactivate
                  </button>
                ) : subscription.plan_id !== 'free' ? (
                  <button
                    type="button"
                    className="billing-btn billing-btn-ghost"
                    disabled={actionLoading}
                    onClick={() => void cancel()}
                  >
                    Cancel subscription
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="billing-card">
          <h2>Usage this period</h2>
          <UsageMetrics metrics={usage} />
        </section>
      </div>

      {canManageBilling ? (
        <section className="billing-section">
          <h2 className="billing-section-title">Plans</h2>
          <PricingCards
            plans={plans}
            currentPlanId={subscription.plan_id}
            billingCycle={billingCycle}
            onCycleChange={setBillingCycle}
            onSelectPlan={handleSelectPlan}
            disabled={actionLoading}
          />
        </section>
      ) : null}

      <section className="billing-section">
        <h2 className="billing-section-title">Invoices</h2>
        <div className="billing-card">
          <InvoiceTable invoices={invoices} orgName={organization.name} plans={plans} />
        </div>
      </section>

      <div className="billing-grid billing-grid--2 billing-section">
        <section className="billing-card">
          <h2>Payment history</h2>
          {payments.length === 0 ? (
            <p className="billing-muted">No payments recorded yet.</p>
          ) : (
            <ul className="billing-payment-list">
              {payments.map((p) => (
                <li key={p.id}>
                  <span>
                    {p.currency} {Number(p.amount).toFixed(2)} · {p.provider}
                  </span>
                  <span className={`billing-status billing-status--${p.status}`}>{p.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="billing-card">
          <h2>Payment methods</h2>
          {paymentMethods.length === 0 ? (
            <p className="billing-muted">
              {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
                ? 'Add a card via Stripe checkout when upgrading.'
                : 'Mock mode — payments are simulated on upgrade.'}
            </p>
          ) : (
            <ul className="billing-payment-list">
              {paymentMethods.map((m) => (
                <li key={m.id}>
                  <span>
                    {m.brand ?? m.type} •••• {m.last4}
                    {m.is_default ? ' (default)' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {canManageBilling && auditLog.length > 0 ? (
        <section className="billing-section">
          <h2 className="billing-section-title">Audit log</h2>
          <div className="billing-card">
            <ul className="billing-audit-list">
              {auditLog.map((entry) => (
                <li key={entry.id}>
                  <span>{entry.action.replace(/\./g, ' · ')}</span>
                  <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
