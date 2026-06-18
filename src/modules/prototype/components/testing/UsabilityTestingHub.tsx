import type { PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';
import { newTestingId } from '../../types/prototypeTesting.types';

interface Props {
  workspace: PrototypeTestingWorkspace;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeTestingWorkspace>) => void;
}

export function UsabilityTestingHub({ workspace, disabled, onChange }: Props) {
  const avgCompletion =
    workspace.usability.length > 0
      ? Math.round(
          workspace.usability.reduce((s, u) => s + (u.taskCompletionRate ?? 0), 0) / workspace.usability.length
        )
      : null;
  const avgSatisfaction =
    workspace.usability.length > 0
      ? (
          workspace.usability.reduce((s, u) => s + (u.satisfactionScore ?? 0), 0) / workspace.usability.length
        ).toFixed(1)
      : null;

  const add = () => {
    onChange({
      usability: [
        ...workspace.usability,
        { id: newTestingId(), feedback: '', taskCompletionRate: null, satisfactionScore: null, painPoints: '', createdAt: new Date().toISOString() },
      ],
    });
  };

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head">
        <h2>Usability testing hub</h2>
        <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={add}>+ Session</button>
      </header>
      <div className="proto-test-usability-stats">
        <div><strong>{avgCompletion != null ? `${avgCompletion}%` : '—'}</strong><span>Task completion</span></div>
        <div><strong>{avgSatisfaction ?? '—'}</strong><span>Satisfaction</span></div>
        <div><strong>{workspace.usability.length}</strong><span>Sessions</span></div>
      </div>
      {workspace.usability.map((u) => (
        <div key={u.id} className="proto-test-usability-card">
          <textarea rows={2} value={u.feedback} disabled={disabled} placeholder="User feedback" onChange={(e) => onChange({ usability: workspace.usability.map((x) => x.id === u.id ? { ...x, feedback: e.target.value } : x) })} />
          <div className="proto-form-grid proto-form-grid--2">
            <input type="number" min={0} max={100} placeholder="Completion %" value={u.taskCompletionRate ?? ''} onChange={(e) => onChange({ usability: workspace.usability.map((x) => x.id === u.id ? { ...x, taskCompletionRate: e.target.value === '' ? null : Number(e.target.value) } : x) })} />
            <input type="number" min={1} max={5} step={0.1} placeholder="Satisfaction 1-5" value={u.satisfactionScore ?? ''} onChange={(e) => onChange({ usability: workspace.usability.map((x) => x.id === u.id ? { ...x, satisfactionScore: e.target.value === '' ? null : Number(e.target.value) } : x) })} />
          </div>
          <input value={u.painPoints} placeholder="Pain points" onChange={(e) => onChange({ usability: workspace.usability.map((x) => x.id === u.id ? { ...x, painPoints: e.target.value } : x) })} />
        </div>
      ))}
    </section>
  );
}
