import type { Defect, DefectSeverity, DefectStatus, PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';
import { newTestingId } from '../../types/prototypeTesting.types';

interface Props {
  workspace: PrototypeTestingWorkspace;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeTestingWorkspace>) => void;
}

const SEVERITIES: DefectSeverity[] = ['critical', 'high', 'medium', 'low'];
const STATUSES: DefectStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export function DefectTracker({ workspace, disabled, onChange }: Props) {
  const add = () => {
    onChange({
      defects: [
        ...workspace.defects,
        {
          id: newTestingId(),
          testCaseId: null,
          title: '',
          description: '',
          severity: 'medium',
          priority: 'medium',
          category: 'functional',
          reproducibility: '',
          owner: '',
          status: 'open',
          resolutionNotes: '',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  };

  const update = (id: string, patch: Partial<Defect>) => {
    onChange({ defects: workspace.defects.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  };

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head">
        <h2>Defect management</h2>
        <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={add}>+ Report defect</button>
      </header>
      {workspace.defects.length === 0 ? (
        <p className="proto-muted">No defects logged.</p>
      ) : (
        <ul className="proto-test-defect-list">
          {workspace.defects.map((d) => (
            <li key={d.id} className={`proto-test-defect proto-test-defect--${d.severity}`}>
              <input value={d.title} disabled={disabled} placeholder="Title" onChange={(e) => update(d.id, { title: e.target.value })} />
              <textarea rows={2} value={d.description} disabled={disabled} onChange={(e) => update(d.id, { description: e.target.value })} />
              <div className="proto-test-defect__meta">
                <select value={d.severity} disabled={disabled} onChange={(e) => update(d.id, { severity: e.target.value as DefectSeverity })}>
                  {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={d.status} disabled={disabled} onChange={(e) => update(d.id, { status: e.target.value as DefectStatus })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input value={d.owner} disabled={disabled} placeholder="Assigned user" onChange={(e) => update(d.id, { owner: e.target.value })} />
              </div>
              <textarea rows={2} value={d.resolutionNotes ?? ''} disabled={disabled} placeholder="Resolution notes" onChange={(e) => update(d.id, { resolutionNotes: e.target.value })} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
