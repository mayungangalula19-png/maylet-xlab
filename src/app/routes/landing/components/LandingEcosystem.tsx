import { Link } from 'react-router-dom';
import { SectionHeading } from './SectionHeading';
import type { EcosystemProgram } from '../landing.types';

interface Props {
  programs: EcosystemProgram[];
}

export function LandingEcosystem({ programs }: Props) {
  return (
    <section className="lp-ecosystem" id="ecosystem">
      <SectionHeading
        kicker="Ecosystem"
        title={
          <>
            Beyond software — a complete <span>innovation ecosystem</span>
          </>
        }
        subtitle="Incubator, academy, and community programs to accelerate your journey"
      />

      <div className="lp-ecosystem-grid">
        {programs.map((program, idx) => (
          <Link
            to={program.route}
            key={program.id}
            className="lp-eco-card fade-in-up"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="lp-eco-card__icon">{program.icon}</div>
            <h3>{program.title}</h3>
            <p>{program.description}</p>
            <div className="lp-eco-card__metric">{program.metric}</div>
            <span className="lp-eco-card__link">Explore →</span>
          </Link>
        ))}
      </div>

      <div className="lp-section-footer">
        <Link to="/ecosystem" className="lp-btn lp-btn--secondary">
          View Ecosystem →
        </Link>
      </div>
    </section>
  );
}
