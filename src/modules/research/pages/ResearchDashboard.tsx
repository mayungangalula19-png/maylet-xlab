import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { ResearchCard } from '../components/ResearchCard';
import { ResearchStats } from '../components/ResearchStats';
import { useResearch } from '../hooks/useResearch';
import '../research.css';

export default function ResearchDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { dashboard, loading, error } = useResearch(user?.id);

  if (authLoading || loading) {
    return (
      <div className="research-page">
        <p>Loading Research Center…</p>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const projects = dashboard?.projects ?? [];

  return (
    <div className="research-page">
      <header className="research-header">
        <div>
          <h1>Research Center</h1>
          <p>Conduct research, organize knowledge, and prepare innovations for experimentation.</p>
        </div>
        <Link to="/projects?create=1" className="research-btn research-btn--primary">
          New Project
        </Link>
      </header>

      {error ? <p className="research-error">{error}</p> : null}

      {stats ? <ResearchStats stats={stats} /> : null}

      <div className="research-layout">
        <aside className="research-glass research-project-list">
          <h3>Active Research</h3>
          {projects.length === 0 ? (
            <p className="research-empty">No projects yet.</p>
          ) : (
            projects.map((p) => <ResearchCard key={p.id} project={p} />)
          )}
        </aside>

        <section className="research-glass research-workspace">
          <div className="research-panel">
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Select a project</h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)' }}>
              Open a project workspace to manage notes, problem definition, findings, literature, documents, and MAYA analysis.
            </p>
            {projects.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {projects.slice(0, 3).map((p) => (
                  <Link key={p.id} to={`/research/${p.id}`} className="research-btn research-btn--secondary">
                    {p.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="research-panel" style={{ marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Documents overview</h3>
            {stats && stats.documents > 0 ? (
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                {stats.documents} uploaded document{stats.documents !== 1 ? 's' : ''} across your portfolio.
              </p>
            ) : (
              <p className="research-empty">No documents uploaded yet.</p>
            )}
          </div>

          <div className="research-panel" style={{ marginTop: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>Progress tracking</h3>
            {stats ? (
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Portfolio completion rate: <strong>{stats.completionRate}%</strong>
              </p>
            ) : (
              <p className="research-empty">Complete setup to track progress.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
