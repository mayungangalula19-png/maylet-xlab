import { useState } from 'react';
import { PageShell } from '../../../components/common/PageShell';
import { useProfile } from '../../../hooks/useProfile';
import { supabase } from '../../../lib/supabase/client';

export default function InnovationDNA() {
  const { user, profile, dna } = useProfile();
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = async () => {
    if (!user?.id) return;
    setAnalyzing(true);
    const strengths = ['Engineering', 'Research', 'Ideation'];
    const weaknesses = ['Business planning', 'Fundraising narrative'];
    await supabase.from('dna_profiles').upsert({
      user_id: user.id,
      strengths,
      weaknesses,
      recommendations: ['Complete a funding pitch with MAYA', 'Run 2 experiments this month'],
      scores: { innovation: 72, research: 80, leadership: 55 },
      analyzed_at: new Date().toISOString(),
    });
    setAnalyzing(false);
    window.location.reload();
  };

  return (
    <PageShell title="Innovation DNA" subtitle="MAYA analyzes your strengths and gaps across the innovator lifecycle.">
      <p>
        <strong>{profile?.full_name ?? user?.email}</strong> · {profile?.user_type ?? 'Innovator'}
      </p>
      {dna ? (
        <div style={{ marginTop: '1rem' }}>
          <h3>Strengths</h3>
          <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 8 }}>
            {JSON.stringify(dna.strengths, null, 2)}
          </pre>
          <h3>Areas to develop</h3>
          <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 8 }}>
            {JSON.stringify(dna.weaknesses, null, 2)}
          </pre>
        </div>
      ) : (
        <button type="button" onClick={runAnalysis} disabled={analyzing} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: 8, border: 'none', background: '#7c5fe6', color: '#fff' }}>
          {analyzing ? 'Analyzing…' : 'Run DNA analysis'}
        </button>
      )}
    </PageShell>
  );
}
