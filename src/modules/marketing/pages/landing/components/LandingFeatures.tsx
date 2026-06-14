import { Link } from 'react-router-dom';
import { SectionHeading } from './SectionHeading';
import type { FeatureModule } from '../landing.types';

interface Props {
  features: FeatureModule[];
}

export function LandingFeatures({ features }: Props) {
  return (
    <section className="lp-features" id="features">
      <SectionHeading
        kicker="Core modules"
        title={
          <>
            Six modules powering your <span>innovation pipeline</span>
          </>
        }
        subtitle="Each module maps to a stage in the Idea → Commercialization journey"
      />

      <div className="lp-features-grid">
        {features.map((feature, idx) => (
          <Link
            to={feature.route}
            key={feature.id}
            className="lp-feature-card fade-in-up"
            style={{ animationDelay: `${idx * 0.08}s` }}
          >
            <span className="lp-feature-card__tag">{feature.tag}</span>
            <div className="lp-feature-card__icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
            <span className="lp-feature-card__link">
              Learn more <span aria-hidden>→</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="lp-section-footer">
        <Link to="/features" className="lp-btn lp-btn--secondary">
          Explore All Features →
        </Link>
      </div>
    </section>
  );
}
