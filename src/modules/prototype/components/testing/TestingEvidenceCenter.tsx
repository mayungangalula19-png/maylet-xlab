import type { PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';
import { newTestingId } from '../../types/prototypeTesting.types';

interface Props {
  workspace: PrototypeTestingWorkspace;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeTestingWorkspace>) => void;
}

export function TestingEvidenceCenter({ workspace, disabled, onChange }: Props) {
  const add = (kind: 'screenshot' | 'video' | 'document' | 'log' | 'report') => {
    onChange({
      evidence: [
        ...workspace.evidence,
        { id: newTestingId(), label: '', kind, url: '', linkedTestCaseId: null, createdAt: new Date().toISOString() },
      ],
    });
  };

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head">
        <h2>Evidence center</h2>
      </header>
      <div className="proto-test-evidence-actions">
        {(['screenshot', 'log', 'report', 'video'] as const).map((k) => (
          <button key={k} type="button" className="proto-btn proto-btn--ghost" disabled={disabled} onClick={() => add(k)}>+ {k}</button>
        ))}
      </div>
      {workspace.evidence.length === 0 ? (
        <p className="proto-muted">Link screenshots, logs, and reports to test results.</p>
      ) : (
        <ul className="proto-test-evidence-list">
          {workspace.evidence.map((e) => (
            <li key={e.id}>
              <span>{e.kind}</span>
              <input value={e.label} placeholder="Label" onChange={(ev) => onChange({ evidence: workspace.evidence.map((x) => x.id === e.id ? { ...x, label: ev.target.value } : x) })} />
              <input value={e.url} placeholder="URL" onChange={(ev) => onChange({ evidence: workspace.evidence.map((x) => x.id === e.id ? { ...x, url: ev.target.value } : x) })} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
