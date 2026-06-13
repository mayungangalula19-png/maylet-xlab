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
        <div className="lp-hero-proof">
          <div className="lp-proof-avatars">
            {testimonials.slice(0, 5).map((t, i) => (
              <span key={t.id} style={{ zIndex: 5 - i }}>
                {t.avatar}
              </span>
            ))}
          </div>
          <div className="lp-proof-text">
            Join <strong>10,000+</strong> innovators building the future
          </div>
        </div>
      </section>

      <section className="lp-hero-visual fade-in-up lp-delay-1">
        <div className="lp-visual-portal">
          <div className="lp-visual-center">X</div>
          <div className="lp-visual-pulse" />
          <div className="lp-visual-orb lp-visual-orb--1" />
          <div className="lp-visual-orb lp-visual-orb--2" />
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
