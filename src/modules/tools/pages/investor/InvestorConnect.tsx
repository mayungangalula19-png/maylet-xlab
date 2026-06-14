import { useEffect, useState } from 'react';
import { PageShell } from '../../../../modules/shared/components/common/PageShell';
import { supabase } from '../../../../lib/supabase/client';
import { Link } from 'react-router-dom';

export default function InvestorConnect() {
  const [investors, setInvestors] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, email, organization_name, bio')
      .eq('role', 'investor')
      .limit(24)
      .then(({ data }) => setInvestors(data ?? []));
  }, []);

  return (
    <PageShell
      title="Investor Connect"
      subtitle="Match startups with investors — MAYA builds investor-ready profiles from your projects."
    >
      <p style={{ marginBottom: '1rem' }}>
        <Link to="/funding/create" style={{ color: '#9b7ff0' }}>
          Prepare pitch with MAYA →
        </Link>
      </p>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {investors.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No verified investors listed yet.</p>
        ) : (
          investors.map((inv) => (
            <div
              key={String(inv.id)}
              style={{
                padding: '1rem',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              <strong>{String(inv.full_name ?? inv.email)}</strong>
              {inv.organization_name ? (
                <span style={{ opacity: 0.7 }}> · {String(inv.organization_name)}</span>
              ) : null}
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}
