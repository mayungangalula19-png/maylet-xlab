import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { getProjects } from '../../../lib/supabase/projects.queries';
import { getInnovationStage } from '../../../lib/innovation/lifecycle';
import type { Project } from '../../../types/project.types';
import '../../projects/components/command-center.css';

export default function ValidationHubPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    getProjects(user.id)
      .then((list) => setProjects(list.filter((p) => getInnovationStage(p) === 'Validation')))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="icc-page">
      <header className="icc-page-header">
        <div>
          <h1>Validation Center</h1>
          <p>Market and hypothesis validation — bridge experiments to funding.</p>
        </div>
        <div className="icc-page-actions">
          <Link to="/experiments" className="icc-btn icc-btn--secondary">Experiments</Link>
          <Link to="/projects" className="icc-btn icc-btn--ghost">Projects</Link>
        </div>
      </header>

      {loading ? (
        <p>Loading validation pipeline…</p>
      ) : projects.length === 0 ? (
        <div className="icc-glass icc-widget">
          <h3>No projects in Validation stage</h3>
          <p>Run experiments and advance project stages from the Innovation Command Center.</p>
          <Link to="/experiments/create" className="icc-btn icc-btn--primary">Create experiment</Link>
        </div>
      ) : (
        <div className="icc-grid">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="icc-glass icc-widget icc-clickable">
              <h3>{p.name}</h3>
              <p>{p.description?.slice(0, 120) ?? 'No description'}</p>
              <span className="icc-badge">Validation · {p.progress ?? 0}%</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
