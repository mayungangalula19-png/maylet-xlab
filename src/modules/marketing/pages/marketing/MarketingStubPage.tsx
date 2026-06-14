import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/** Lightweight public marketing page shell for landing footer links. */
export function MarketingStubPage({ title, subtitle, children }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
        color: '#fff',
        padding: '2rem',
      }}
    >
      <Link to="/" style={{ color: '#9b7ff0', textDecoration: 'none' }}>
        ← Back to Home
      </Link>
      <header style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>{title}</h1>
        {subtitle && <p style={{ margin: '0.75rem 0 0', opacity: 0.7 }}>{subtitle}</p>}
      </header>
      <div style={{ maxWidth: 720, margin: '0 auto', opacity: 0.9, lineHeight: 1.7 }}>
        {children ?? (
          <p>
            This page is part of the Maylet XLab public site. Explore the platform or contact us for
            more information.
          </p>
        )}
        <p style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/register" style={{ color: '#7c5fe6', fontWeight: 600 }}>
            Get Started →
          </Link>
          <Link to="/contact" style={{ color: '#9b7ff0' }}>
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}

export default MarketingStubPage;
