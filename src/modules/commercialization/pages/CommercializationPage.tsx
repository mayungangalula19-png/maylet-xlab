import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { getProjects } from '../../../lib/supabase/projects.queries';
import { getInnovationStage } from '../../../lib/innovation/lifecycle';
import { getCommercializationBreakdown } from '../../../lib/innovation/recommendations';
import { CommercializationReadiness } from '../../../components/projects';
import type { Project } from '../../../types/project.types';
import '../../projects/components/command-center.css';

export default function CommercializationPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    getProjects(user.id)
      .then((list) => {
        const eligible = list.filter((p) => {
          const stage = getInnovationStage(p);
          return stage === 'Funding' || stage === 'Commercialization' || p.status === 'Launched';
        });
        setProjects(eligible);
        if (eligible.length && !selectedId) setSelectedId(eligible[0].id);
      })
      .finally(() => setLoading(false));
  }, [user?.id, selectedId]);

  const selected = projects.find((p) => p.id === selectedId) ?? null;
  const breakdown = getCommercializationBreakdown(selected);

  return (
    <div className="icc-page">
      <header className="icc-page-header">
        <div>
          <h1>Commercialization</h1>
          <p>Go-to-market readiness, revenue potential, and launch preparation.</p>
        </div>
        <Link to="/funding" className="icc-btn icc-btn--secondary">Funding hub</Link>
      </header>

      {loading ? (
        <p>Loading commercialization portfolio…</p>
      ) : projects.length === 0 ? (
        <div className="icc-glass icc-widget">
          <h3>No projects ready for commercialization</h3>
          <p>Advance projects through validation and funding first.</p>
          <Link to="/validation" className="icc-btn icc-btn--primary">Validation center</Link>
        </div>
      ) : (
        <>
          <div className="icc-panel" style={{ marginBottom: '1rem' }}>
            <label htmlFor="comm-project">Project</label>
            <select
              id="comm-project"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <CommercializationReadiness
            breakdown={{
              ...breakdown,
              projectId: selected?.id,
              projectName: selected?.name,
            }}
          />
        </>
      )}
    </div>
  );
}
