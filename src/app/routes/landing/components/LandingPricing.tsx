import { Link } from 'react-router-dom';
import { SectionHeading } from './SectionHeading';
import type { PricingPlan } from '../landing.types';

interface Props {
  plans: PricingPlan[];
}

export function LandingPricing({ plans }: Props) {
  return (
    <section className="lp-pricing" id="pricing">
      <SectionHeading
        kicker="Pricing"
        title={
          <>
            Plans that <span>scale with you</span>
          </>
        }
        subtitle="Start free, upgrade as your innovation pipeline grows"
      />

      <div className="lp-pricing-grid">
        {plans.map((plan, idx) => (
          <article
            key={plan.name}
            className={`lp-pricing-card fade-in-up ${plan.popular ? 'lp-pricing-card--highlighted' : ''}`}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            {plan.popular && <span className="lp-pricing-card__badge">Most popular</span>}
            <h3>{plan.name}</h3>
            <div className="lp-pricing-card__price">
              <span className="lp-pricing-card__amount">{plan.price}</span>
              {plan.period && <span className="lp-pricing-card__period">{plan.period}</span>}
            </div>
            <p className="lp-pricing-card__desc">{plan.tagline}</p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>
                  <span aria-hidden>✓</span> {feature}
                </li>
              ))}
            </ul>
            <Link
              to={plan.ctaLink}
              className={`lp-btn ${plan.popular ? 'lp-btn--primary' : 'lp-btn--secondary'}`}
            >
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
