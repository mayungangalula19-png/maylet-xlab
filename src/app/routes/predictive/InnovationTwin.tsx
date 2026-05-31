import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageShell } from '../../../components/common/PageShell';
import { supabase } from '../../../lib/supabase/client';
import { calculateInnovationScores } from '../../../lib/maya/scoring';

export default function InnovationTwin() {
  const { id } = useParams();
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [prediction, setPrediction] = useState<ReturnType<typeof calculateInnovationScores> | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProject(data);
        if (data) {
          setPrediction(
            calculateInnovationScores({
              title: String(data.name),
              description: String(data.description ?? ''),
              stage: String(data.status),
            })
          );
        }
      });
  }, [id]);

  if (!project) return <PageShell title="Innovation Twin">Loading…</PageShell>;

  const successChance = prediction?.innovation_score ?? 0;

  return (
    <PageShell
      title="Digital Innovation Twin"
      subtitle={`Live profile for ${String(project.name)}`}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', background: 'rgba(124,95,230,0.15)', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{successChance}%</div>
          <div style={{ opacity: 0.7 }}>Success potential</div>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem' }}>{String(project.progress ?? 0)}%</div>
          <div style={{ opacity: 0.7 }}>Progress</div>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem' }}>{String(project.status)}</div>
          <div style={{ opacity: 0.7 }}>Stage</div>
        </div>
      </div>
      <h3>Predicted risks</h3>
      <ul>
        <li>Budget alignment — review monthly burn</li>
        <li>Team capacity — confirm experiment ownership</li>
        <li>Market competition — run MAYA market analysis</li>
      </ul>
      <Link to={`/ai-assistant?project=${id}`} style={{ color: '#9b7ff0' }}>
        Discuss twin with MAYA →
      </Link>
    </PageShell>
  );
}
