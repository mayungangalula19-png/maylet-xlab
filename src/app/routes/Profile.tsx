import { useMemo } from 'react';
import { PageShell } from '../../components/common/PageShell';

export function Profile() {
  const subtitle = useMemo(() => {
    return 'User profile overview and account settings.';
  }, []);

  return (
    <PageShell title="Profile" subtitle={subtitle}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
        }}
      >
        <div
          style={{
            padding: '1.1rem',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Account</h2>
          <p style={{ margin: '0.6rem 0 0', opacity: 0.78, lineHeight: 1.5, fontSize: '0.95rem' }}>
            Profile details are managed by the dashboard and settings sections.
          </p>
        </div>

        <div
          style={{
            padding: '1.1rem',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Security</h2>
          <p style={{ margin: '0.6rem 0 0', opacity: 0.78, lineHeight: 1.5, fontSize: '0.95rem' }}>
            Update password, sessions, and security preferences from your security settings.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

