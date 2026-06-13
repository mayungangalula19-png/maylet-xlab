import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useValidationList } from '../hooks/useValidation';
import { ValidationCard } from '../components/ValidationCard';
import '../../projects/components/command-center.css';
import '../styles/validation.css';

export default function ValidationPage() {
  const { user } = useAuth();
  const { records, stats, loading, error } = useValidationList(user?.id);

  return (
    <div className="icc-page val-page">
      <header className="icc-page-header">
        <div>
          <h1>Validation Center</h1>
          <p>Decision gate between Experiment and Funding — evidence-based readiness scoring.</p>
        </div>
        <div className="icc-page-actions">
          <Link to="/validation/new" className="val-btn val-btn--primary">New validation</Link>
          <Link to="/experiments" className="val-btn val-btn--secondary">Experiments</Link>
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
          <h3>No validations yet</h3>
          <p>Run experiments, then create a validation review to score funding readiness.</p>
          <Link to="/validation/new" className="val-btn val-btn--primary">Create validation</Link>
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
