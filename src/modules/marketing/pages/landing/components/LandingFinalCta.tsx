import { Link } from 'react-router-dom';

interface Props {
  isAuthenticated: boolean;
}

export function LandingFinalCta({ isAuthenticated }: Props) {
  return (
    <section className="lp-final-cta">
      <div className="lp-final-cta__inner fade-in-up">
        <h2>
          Ready to turn your <span>idea into impact</span>?
        </h2>
        <p>
          Join thousands of innovators using Maylet XLab to move from research to commercialization —
          faster and with less friction.
        </p>
        <div className="lp-final-cta__buttons">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="lp-btn lp-btn--primary lp-btn--lg">
                Go to Dashboard →
              </Link>
              <Link to="/projects/new" className="lp-btn lp-btn--secondary lp-btn--lg">
                Create New Project
              </Link>
            </>
          ) : (
            <>
              <Link to="/register" className="lp-btn lp-btn--primary lp-btn--lg">
                Get Started Free →
              </Link>
              <Link to="/login" className="lp-btn lp-btn--secondary lp-btn--lg">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
