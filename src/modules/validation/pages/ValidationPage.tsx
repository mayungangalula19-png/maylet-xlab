import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useValidationList } from '../hooks/useValidation';
import { ValidationCard } from '../components/ValidationCard';
import '../../projects/components/command-center.css';
import '../styles/validation.css';

export default function ValidationPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const { records, stats, loading, error } = useValidationList(user?.id, projectId);

  const newValidationHref = projectId
    ? `/validation/new?projectId=${projectId}`
    : '/validation/new';

  return (
    <div className="icc-page val-page">
      <header className="icc-page-header">
        <div>
          <h1>Validation Center</h1>
          <p>Decision gate between Experiment and Funding — evidence-based readiness scoring.</p>
          {projectId && (
            <p className="val-filter-note">
              Showing validations for project{' '}
              <code>{projectId}</code>
              {' · '}
              <Link to="/validation">Clear filter</Link>
            </p>
          )}
        </div>
        <div className="icc-page-actions">
          <Link to={newValidationHref} className="val-btn val-btn--primary">
            New validation
          </Link>
          <Link
            to={projectId ? `/experiments?projectId=${projectId}` : '/experiments'}
            className="val-btn val-btn--secondary"
          >
            Experiments
          </Link>
        </div>
      </header>

      {error && <p className="val-error">{error}</p>}

      <div className="val-stats">
        <div className="val-stat"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="val-stat"><span>Pass</span><strong>{stats.pass}</strong></div>
        <div className="val-stat"><span>Hold</span><strong>{stats.hold}</strong></div>
        <div className="val-stat"><span>Fail</span><strong>{stats.fail}</strong></div>
        <div className="val-stat"><span>Avg readiness</span><strong>{stats.avgReadiness}</strong></div>
      </div>

      {loading ? (
        <p>Loading validations…</p>
      ) : records.length === 0 ? (
        <div className="icc-glass icc-widget">
          <h3>{projectId ? 'No validations for this project' : 'No validations yet'}</h3>
          <p>
            {projectId
              ? 'Create a validation review for this project after experiments are complete.'
              : 'Run experiments, then create a validation review to score funding readiness.'}
          </p>
          <Link to={newValidationHref} className="val-btn val-btn--primary">
            Create validation
          </Link>
        </div>
      ) : (
        <div className="val-grid">
          {records.map((r) => (
            <ValidationCard key={r.id} record={r} />
          ))}
        </div>
      )}
    </div>
  );
}
