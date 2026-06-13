import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { BuildEditor } from '../components/BuildEditor';
import { VersionHistory } from '../components/VersionHistory';
import { useBuildRunner } from '../hooks/useBuildRunner';
import { usePrototype } from '../hooks/usePrototype';
import '../prototype.css';

export default function PrototypeBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prototype, builds, loading, refresh } = usePrototype(user?.id, id);
  const { running, lastBuild, error, runBuild } = useBuildRunner(user?.id, id);

  if (!id) {
    navigate('/prototypes');
    return null;
  }

  if (loading) {
    return <div className="proto-page"><p>Loading builder…</p></div>;
  }

  if (!prototype) {
    return (
      <div className="proto-page">
        <p className="proto-error">Prototype not found.</p>
        <Link to="/prototypes" className="proto-btn proto-btn--ghost">← Back to prototypes</Link>
      </div>
    );
  }

  return (
    <div className="proto-page">
      <nav className="proto-breadcrumb">
        <Link to="/prototypes">Prototypes</Link>
        <span>/</span>
        <Link to={`/prototypes/${id}/workspace`}>{prototype.name}</Link>
        <span>/</span>
        <span>Builder</span>
      </nav>

      <header className="proto-header">
        <h1>Prototype Builder</h1>
        <Link to={`/prototypes/${id}/workspace`} className="proto-btn proto-btn--ghost">Back to workspace</Link>
      </header>

      {error ? <p className="proto-error">{error}</p> : null}

      <BuildEditor
        running={running}
        onRun={async (config) => {
          await runBuild(config);
          await refresh();
        }}
      />

      {lastBuild && (
        <div className="proto-panel" style={{ marginTop: '1rem' }}>
          <h3>Last build — {lastBuild.status}</h3>
          <pre className="proto-logs">{lastBuild.logs.join('\n')}</pre>
        </div>
      )}

      <VersionHistory prototype={prototype} builds={builds} />
    </div>
  );
}
