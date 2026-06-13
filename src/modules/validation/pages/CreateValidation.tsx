import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCreateValidation } from '../hooks/useValidation';
import '../../projects/components/command-center.css';
import '../styles/validation.css';

export default function CreateValidationPage() {
  const { user } = useAuth();
  const { eligible, loading, submitting, error, create } = useCreateValidation(user?.id);
  const [projectId, setProjectId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectId) create(projectId);
  };

  return (
    <div className="icc-page val-page">
      <header className="icc-page-header">
        <div>
          <h1>New validation</h1>
          <p>Select a project to aggregate Research, Prototype, and Experiment evidence.</p>
        </div>
        <Link to="/validation" className="val-btn val-btn--secondary">Back</Link>
      </header>

      {loading ? (
        <p>Loading eligible projects…</p>
      ) : eligible.length === 0 ? (
        <div className="icc-glass icc-widget">
          <h3>No eligible projects</h3>
          <p>Projects in Prototype, Experiment, or Validation stage can be reviewed.</p>
          <Link to="/experiments/create" className="val-btn val-btn--primary">Create experiment</Link>
        </div>
      ) : (
        <form className="val-create-form icc-panel" onSubmit={handleSubmit}>
          <label htmlFor="val-project">Project</label>
          <select
            id="val-project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
          >
            <option value="">Select project…</option>
            {eligible.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {error && <p className="val-error">{error}</p>}
          <button type="submit" className="val-btn val-btn--primary" disabled={submitting || !projectId}>
            {submitting ? 'Evaluating…' : 'Run validation'}
          </button>
        </form>
      )}
    </div>
  );
}
