import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { AIEvaluationPanel } from '../components/AIEvaluationPanel';
import { TestResultsPanel } from '../components/TestResultsPanel';
import { usePrototype } from '../hooks/usePrototype';
import { usePrototypeTesting } from '../hooks/usePrototypeTesting';
import { getPrototypeRecommendation } from '../ai/recommendationEngine';
import { useMemo } from 'react';
import '../prototype.css';

export default function PrototypeTesting() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prototype, tests, aiEval, loading, withSaving } = usePrototype(user?.id, id);

  const { passRate, failedCount, passedCount, recordTest } = usePrototypeTesting({
    prototypeId: id,
    userId: user?.id,
    tests,
    withSaving,
  });

  const recommendation = useMemo(() => {
    if (!prototype) return null;
    return getPrototypeRecommendation({ prototype, testPassRate: passRate });
  }, [prototype, passRate]);

  if (!id) {
    navigate('/prototypes');
    return null;
  }

  if (loading) {
    return (
      <div className="proto-page">
        <p>Loading testing center…</p>
      </div>
    );
  }

  if (!prototype) {
    return (
      <div className="proto-page">
        <p className="proto-error">Prototype not found.</p>
        <Link to="/prototypes" className="proto-btn proto-btn--ghost">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="proto-page">
      <nav className="proto-breadcrumb">
        <Link to="/prototypes">Prototypes</Link>
        <span>/</span>
        <Link to={`/prototypes/${id}`}>{prototype.name}</Link>
        <span>/</span>
        <span>Testing</span>
      </nav>

      <header className="proto-header">
        <h1>Testing Center</h1>
        <Link to={`/prototypes/${id}`} className="proto-btn proto-btn--ghost">
          Back to workspace
        </Link>
      </header>

      <div className="proto-stats proto-stats--inline">
        <div className="proto-stat">
          <strong>{tests.length}</strong>
          <span>Test runs</span>
        </div>
        <div className="proto-stat">
          <strong>{Math.round(passRate * 100)}%</strong>
          <span>Success rate</span>
        </div>
        <div className="proto-stat">
          <strong>{passedCount}</strong>
          <span>Passed</span>
        </div>
        <div className="proto-stat">
          <strong>{failedCount}</strong>
          <span>Failed</span>
        </div>
      </div>

      <AIEvaluationPanel
        evaluation={aiEval}
        readinessScore={recommendation?.readinessScore}
        nextAction={recommendation?.nextAction}
      />

      <TestResultsPanel tests={tests} onRecord={recordTest} />
    </div>
  );
}
