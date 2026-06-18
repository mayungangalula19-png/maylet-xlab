import { useState } from 'react';
import type { PrototypeTestingWorkspace, TestPlan } from '../../types/prototypeTesting.types';
import { newTestingId } from '../../types/prototypeTesting.types';

interface Props {
  workspace: PrototypeTestingWorkspace;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeTestingWorkspace>) => void;
}

export function TestPlanManager({ workspace, disabled, onChange }: Props) {
  const [editing, setEditing] = useState<TestPlan | null>(null);

  const save = () => {
    if (!editing) return;
    const exists = workspace.testPlans.some((p) => p.id === editing.id);
    onChange({
      testPlans: exists
        ? workspace.testPlans.map((p) => (p.id === editing.id ? editing : p))
        : [...workspace.testPlans, editing],
    });
    setEditing(null);
  };

  const clone = (plan: TestPlan) => {
    const copy: TestPlan = {
      ...plan,
      id: newTestingId(),
      title: `${plan.title} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onChange({ testPlans: [...workspace.testPlans, copy] });
  };

  const remove = (id: string) => {
    onChange({ testPlans: workspace.testPlans.filter((p) => p.id !== id) });
    if (editing?.id === id) setEditing(null);
  };

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head">
        <h2>Test plan management</h2>
        <button
          type="button"
          className="proto-btn proto-btn--secondary"
          disabled={disabled}
          onClick={() =>
            setEditing({
              id: newTestingId(),
              title: '',
              objective: '',
              scope: '',
              methodology: '',
              successCriteria: '',
              exitCriteria: '',
              owner: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
          }
        >
          + Create plan
        </button>
      </header>

      {workspace.testPlans.length === 0 && !editing ? (
        <p className="proto-muted">No test plans yet. Create one to structure your validation approach.</p>
      ) : (
        <ul className="proto-test-plan-list">
          {workspace.testPlans.map((p) => (
            <li key={p.id} className="proto-test-plan-card">
              <strong>{p.title || 'Untitled plan'}</strong>
              <span>{p.owner || 'Unassigned'}</span>
              <p>{p.objective.slice(0, 120) || 'No objective'}</p>
              <div className="proto-test-plan-card__actions">
                <button type="button" className="proto-btn proto-btn--ghost" disabled={disabled} onClick={() => setEditing(p)}>
                  Edit
                </button>
                <button type="button" className="proto-btn proto-btn--ghost" disabled={disabled} onClick={() => clone(p)}>
                  Clone
                </button>
                <button type="button" className="proto-btn proto-btn--ghost" disabled={disabled} onClick={() => remove(p.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <div className="proto-test-form">
          <input value={editing.title} placeholder="Plan title" onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          <input value={editing.owner} placeholder="Owner" onChange={(e) => setEditing({ ...editing, owner: e.target.value })} />
          <textarea rows={2} value={editing.objective} placeholder="Objective" onChange={(e) => setEditing({ ...editing, objective: e.target.value })} />
          <textarea rows={2} value={editing.scope} placeholder="Scope" onChange={(e) => setEditing({ ...editing, scope: e.target.value })} />
          <textarea rows={2} value={editing.methodology} placeholder="Methodology" onChange={(e) => setEditing({ ...editing, methodology: e.target.value })} />
          <textarea rows={2} value={editing.successCriteria} placeholder="Success metrics" onChange={(e) => setEditing({ ...editing, successCriteria: e.target.value })} />
          <textarea rows={2} value={editing.exitCriteria} placeholder="Exit criteria" onChange={(e) => setEditing({ ...editing, exitCriteria: e.target.value })} />
          <div className="proto-test-form__actions">
            <button type="button" className="proto-btn proto-btn--ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button type="button" className="proto-btn proto-btn--primary" disabled={disabled} onClick={save}>
              Save plan
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
