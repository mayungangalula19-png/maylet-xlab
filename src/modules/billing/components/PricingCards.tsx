import type { BillingCycle, SubscriptionPlan } from '../types/billing.types';

interface PricingCardsProps {
  plans: SubscriptionPlan[];
  currentPlanId: string;
  billingCycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
  onSelectPlan: (planId: SubscriptionPlan['id']) => void;
  disabled?: boolean;
}

export function PricingCards({
  plans,
  currentPlanId,
  billingCycle,
  onCycleChange,
  onSelectPlan,
  disabled,
}: PricingCardsProps) {
  return (
    <section className="billing-pricing">
      <div className="billing-cycle-toggle">
        <button
          type="button"
          className={billingCycle === 'monthly' ? 'active' : ''}
          onClick={() => onCycleChange('monthly')}
        >
          Monthly
        </button>
        <button
          type="button"
          className={billingCycle === 'yearly' ? 'active' : ''}
          onClick={() => onCycleChange('yearly')}
        >
          Yearly <span className="billing-save">Save ~20%</span>
        </button>
      </div>
      <div className="billing-pricing-grid">
        {plans.map((plan) => {
          const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
          const isCurrent = plan.id === currentPlanId;
          return (
            <article
              key={plan.id}
              className={`billing-plan-card ${plan.id === 'pro' ? 'featured' : ''} ${isCurrent ? 'current' : ''}`}
            >
              {plan.id === 'pro' ? <span className="billing-plan-badge">Popular</span> : null}
              <h3>{plan.name}</h3>
              <p className="billing-plan-price">
                ${price}
                <span>/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
              </p>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button
                type="button"
                className="billing-btn billing-btn-primary"
                disabled={disabled || isCurrent}
                onClick={() => onSelectPlan(plan.id)}
              >
                {isCurrent ? 'Current plan' : plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
