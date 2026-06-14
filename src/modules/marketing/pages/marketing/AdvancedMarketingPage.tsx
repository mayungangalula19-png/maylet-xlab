import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import './marketing-page.css';

export interface MarketingCta {
  label: string;
  to: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface Props {
  pill: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
  children: ReactNode;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctas?: MarketingCta[];
  disclaimer?: string;
}

export function AdvancedMarketingPage({
  pill,
  title,
  titleAccent,
  subtitle,
  children,
  ctaTitle,
  ctaSubtitle,
  ctas,
  disclaimer,
}: Props) {
  return (
    <div className="mkt-page">
      <Link to="/" className="mkt-back">
        ← Back to Home
      </Link>

      <div className="mkt-container">
        <header className="mkt-hero">
          <div className="mkt-pill">{pill}</div>
          <h1>
            {title}
            {titleAccent ? (
              <>
                {' '}
                <span>{titleAccent}</span>
              </>
            ) : null}
          </h1>
          <p>{subtitle}</p>
        </header>

        {children}

        {ctaTitle && ctas && ctas.length > 0 && (
          <section className="mkt-cta">
            <h2>{ctaTitle}</h2>
            {ctaSubtitle && <p>{ctaSubtitle}</p>}
            <div className="mkt-cta__actions">
              {ctas.map((cta) => (
                <Link
                  key={cta.to + cta.label}
                  to={cta.to}
                  className={`mkt-btn mkt-btn--${cta.variant ?? 'primary'}`}
                >
                  {cta.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {disclaimer && <p className="mkt-disclaimer">{disclaimer}</p>}
      </div>
    </div>
  );
}

export default AdvancedMarketingPage;
