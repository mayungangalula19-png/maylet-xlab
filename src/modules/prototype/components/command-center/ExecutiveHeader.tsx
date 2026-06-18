import { Link } from 'react-router-dom';

interface Props {
  innovationHealth: number;
  currentQuarter: string;
  live: boolean;
  onToggleLive: () => void;
  newHref: string;
  projectId?: string;
}

export function ExecutiveHeader({
  innovationHealth,
  currentQuarter,
  live,
  onToggleLive,
  newHref,
  projectId,
}: Props) {
  return (
    <header className="proto-cc-executive">
      <div className="proto-cc-executive__main">
        <span className="proto-cc-executive__eyebrow">MAYLET X LAB · Innovation Command Center</span>
        <h1>Prototype Portfolio HQ</h1>
        <p className="proto-cc-executive__sub">
          Organization workspace · Active innovation cycle · {currentQuarter}
        </p>
        <div className="proto-cc-health">
          <span>Innovation health</span>
          <strong>{innovationHealth}</strong>
          <div className="proto-cc-health__bar">
            <div className="proto-cc-health__fill" style={{ width: `${innovationHealth}%` }} />
          </div>
        </div>
      </div>
      <div className="proto-cc-executive__actions">
        <button
          type="button"
          className={`proto-cc-live${live ? ' proto-cc-live--on' : ''}`}
          onClick={onToggleLive}
          title="Auto-refresh every 30s"
        >
          {live ? '● Live' : '○ Paused'}
        </button>
        <Link to={newHref} className="proto-btn proto-btn--primary">
          + Create prototype
        </Link>
        <Link to="/prototypes/upload" className="proto-btn proto-btn--secondary">
          Import
        </Link>
        <Link to={newHref} className="proto-btn proto-btn--secondary">
          AI prototype
        </Link>
        {projectId ? (
          <Link to={`/prototypes?projectId=${projectId}`} className="proto-btn proto-btn--ghost">
            Builder hub
          </Link>
        ) : (
          <Link to="/prototypes" className="proto-btn proto-btn--ghost">
            Launch builder
          </Link>
        )}
        <Link to="/validation" className="proto-btn proto-btn--ghost">
          Validation center
        </Link>
      </div>
    </header>
  );
}
