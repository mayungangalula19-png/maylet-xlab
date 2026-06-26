import { Link } from 'react-router-dom';
import type { FlowStep, Testimonial } from '../landing.types';

interface Props {
  steps: FlowStep[];
  testimonials: Testimonial[];
  isAuthenticated: boolean;
}

export function LandingHero({ steps, testimonials, isAuthenticated }: Props) {
  return (
    <main id="main-content" className="lp-hero">
      <section className="lp-hero-copy fade-in-up">
        <div className="lp-hero-pill">
          <span>🚀</span> Idea → Commercialization in One Platform
        </div>
        <h1>
          From <span>Idea</span> to Scalable Startup
        </h1>
        <p>
          Maylet XLab unifies research, prototypes, experiments, validation, and funding — so innovators
          move through every stage without switching tools.
        </p>
        <div className="lp-hero-buttons">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="lp-btn lp-btn--primary">
                Open Dashboard →
              </Link>
              <Link to="/projects" className="lp-btn lp-btn--secondary">
                My Projects
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="lp-btn lp-btn--primary">
                Start Building Now →
              </Link>
              <Link to="/features" className="lp-btn lp-btn--secondary">
                Explore Features
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="lp-hero-visual fade-in-up lp-delay-1">
        <div
          className="lp-visual-portal"
          style={{
            backgroundImage: 'url("/images/maylet%20xlab.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        >

        </div>
        <div className="lp-flow-grid">
          {steps.map((step, idx) => (
            <Link
              to={step.route}
              key={step.id}
              className="lp-flow-tag"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <span className="lp-flow-tag__icon">{step.icon}</span>
              <strong>{step.label}</strong>
              <small>{step.description}</small>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
