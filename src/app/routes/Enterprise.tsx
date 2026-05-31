import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '../../components/common/PageShell';

type EnterpriseCard = {
  title: string;
  desc: string;
  path: string;
  badge?: string;
};

type Cta = {
  label: string;
  to: string;
  variant: 'primary' | 'secondary';
};

function Card({ card }: { card: EnterpriseCard }) {
  return (
    <Link
      to={card.path}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        padding: '1.25rem',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.035)',
        border: '1px solid rgba(255,255,255,0.08)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 120ms ease, border-color 120ms ease, background 120ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.18)';
        (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.055)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0px)';
        (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.035)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', letterSpacing: 0.1 }}>{card.title}</h3>
        {card.badge ? (
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.6rem',
              borderRadius: 999,
              background: 'rgba(124, 92, 255, 0.18)',
              border: '1px solid rgba(124, 92, 255, 0.35)',
              color: 'rgba(255,255,255,0.92)',
              whiteSpace: 'nowrap',
            }}
          >
            {card.badge}
          </span>
        ) : null}
      </div>
      <p style={{ margin: 0, opacity: 0.78, lineHeight: 1.45, fontSize: '0.92rem' }}>{card.desc}</p>
      <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{ opacity: 0.75, fontSize: '0.9rem' }}>Open</span>
        <span aria-hidden style={{ opacity: 0.75 }}>
          →
        </span>
      </div>
    </Link>
  );
}

function CtaButton({ cta }: { cta: Cta }) {
  const style =
    cta.variant === 'primary'
      ? {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.95rem 1.1rem',
          borderRadius: 12,
          background: 'rgba(124, 92, 255, 0.95)',
          border: '1px solid rgba(124, 92, 255, 0.9)',
          color: 'white',
          textDecoration: 'none',
          fontWeight: 650,
          letterSpacing: 0.1,
        }
      : {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.95rem 1.1rem',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'inherit',
          textDecoration: 'none',
          fontWeight: 600,
          letterSpacing: 0.1,
        };

  return (
    <Link to={cta.to} style={style}>
      {cta.label}
    </Link>
  );
}

export default function Enterprise() {
  const cards: EnterpriseCard[] = useMemo(
    () => [
      {
        title: 'Enterprise Vault',
        desc: 'Centralize SOPs, contracts, and policy documents—built for fast retrieval.',
        path: '/enterprise/vault',
        badge: 'Knowledge Vault',
      },
      {
        title: 'Team workspaces',
        desc: 'Coordinate cross-department tasks with shared standards and repeatable workflows.',
        path: '/teams',
        badge: 'Collaboration',
      },
      {
        title: 'MAYA Enterprise Agent',
        desc: 'An AI brain that helps your company apply policies, answer questions, and reduce busywork.',
        path: '/ai-assistant',
        badge: 'AI Brain',
      },
    ],
    []
  );

  const ctas: Cta[] = useMemo(
    () => [
      { label: 'Explore the Vault', to: '/enterprise/vault', variant: 'primary' },
      { label: 'Open Team Workspaces', to: '/teams', variant: 'secondary' },
    ],
    []
  );

  return (
    <PageShell
      title="Enterprise"
      subtitle="MAYA Enterprise — organization knowledge vault, SOPs, and team policies."
    >
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {/* Hero */}
        <section
          style={{
            padding: '1.4rem 1.35rem',
            borderRadius: 16,
            background: 'linear-gradient(180deg, rgba(124, 92, 255, 0.16) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(124, 92, 255, 0.25)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ maxWidth: 720 }}>
              <h1 style={{ margin: 0, fontSize: '1.4rem', letterSpacing: 0.2 }}>Operate with institutional clarity</h1>
              <p style={{ margin: '0.65rem 0 0', opacity: 0.82, lineHeight: 1.5 }}>
                Build a single source of truth for how your org works: policies, SOPs, and team agreements—plus an AI agent that can apply them.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {ctas.map((cta) => (
                <CtaButton key={cta.to} cta={cta} />
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: '1rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {[
              { k: 'SOP-ready', v: 'Turn tribal knowledge into reusable playbooks' },
              { k: 'Policy-aware', v: 'Make sure decisions match internal standards' },
              { k: 'Team-aligned', v: 'Reduce rework with shared workflows' },
            ].map((s) => (
              <div
                key={s.k}
                style={{
                  padding: '0.9rem 0.95rem',
                  borderRadius: 14,
                  background: 'rgba(0,0,0,0.10)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 650 }}>{s.k}</div>
                <div style={{ marginTop: '0.4rem', fontSize: '0.9rem', opacity: 0.78, lineHeight: 1.35 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature cards */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Core enterprise modules</h2>
            <div style={{ opacity: 0.75, fontSize: '0.92rem' }}>Start with what your org needs most.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {cards.map((card) => (
              <Card key={card.path} card={card} />
            ))}
          </div>
        </section>

        {/* Getting started */}
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem' }}>Getting started</h2>
            <div style={{ opacity: 0.75, fontSize: '0.92rem' }}>A quick path to onboard your enterprise knowledge.</div>
          </div>

          <ol
            style={{
              margin: '1rem 0 0',
              paddingLeft: '1.15rem',
              display: 'grid',
              gap: '0.75rem',
            }}
          >
            {[ 
              {
                step: '01',
                title: 'Populate the Enterprise Vault',
                body: 'Add SOPs, contracts, and policy docs so the team can find the right answer instantly.',
                to: '/enterprise/vault',
              },
              {
                step: '02',
                title: 'Create team workspaces',
                body: 'Use shared spaces to standardize collaboration across departments.',
                to: '/teams',
              },
              {
                step: '03',
                title: 'Activate the Enterprise Agent',
                body: 'Enable the AI agent to apply your org policies and respond with consistent context.',
                to: '/ai-assistant',
              },
            ].map((s) => (
              <li key={s.step} style={{ listStyle: 'decimal', marginLeft: 0, paddingLeft: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '0.9rem', alignItems: 'start' }}>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      opacity: 0.85,
                      paddingTop: '0.1rem',
                    }}
                  >
                    {s.step}
                  </div>
                  <div>
                    <div style={{ fontWeight: 750, fontSize: '1rem', marginBottom: '0.25rem' }}>{s.title}</div>
                    <div style={{ opacity: 0.78, lineHeight: 1.5, marginBottom: '0.6rem' }}>{s.body}</div>
                    <Link
                      to={s.to}
                      style={{
                        display: 'inline-flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        color: 'rgba(255,255,255,0.9)',
                        textDecoration: 'none',
                        fontWeight: 650,
                        borderBottom: '1px solid rgba(255,255,255,0.25)',
                        paddingBottom: '0.1rem',
                      }}
                    >
                      Continue <span aria-hidden style={{ opacity: 0.8 }}>→</span>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </PageShell>
  );
}

