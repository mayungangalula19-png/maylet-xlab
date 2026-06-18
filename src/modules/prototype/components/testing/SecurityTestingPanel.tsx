import type { DefectSeverity, DefectStatus, PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';
import { newTestingId } from '../../types/prototypeTesting.types';

interface Props {
  workspace: PrototypeTestingWorkspace;
  securityScore: number;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeTestingWorkspace>) => void;
}

export function SecurityTestingPanel({ workspace, securityScore, disabled, onChange }: Props) {
  const add = () => {
    onChange({
      security: [
        ...workspace.security,
        { id: newTestingId(), title: '', category: 'auth', severity: 'medium', description: '', status: 'open', createdAt: new Date().toISOString() },
      ],
    });
  };

  const update = (id: string, patch: Partial<(typeof workspace.security)[0]>) => {
    onChange({ security: workspace.security.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  };

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head">
        <h2>Security testing</h2>
        <span className="proto-test-security-score">Score: {securityScore}%</span>
      </header>
      <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={add}>+ Add finding</button>
      {workspace.security.length === 0 ? (
        <p className="proto-muted">No security findings recorded.</p>
      ) : (
        <ul className="proto-test-security-list">
          {workspace.security.map((f) => (
            <li key={f.id}>
              <input value={f.title} placeholder="Finding" onChange={(e) => update(f.id, { title: e.target.value })} />
              <select value={f.severity} onChange={(e) => update(f.id, { severity: e.target.value as DefectSeverity })}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={f.status} onChange={(e) => update(f.id, { status: e.target.value as DefectStatus })}>
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
