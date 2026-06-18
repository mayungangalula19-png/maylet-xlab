import type {
  PrototypeTestingWorkspace,
  TestCase,
  TestCasePriority,
  TestCaseStatus,
  TestCategory,
} from '../../types/prototypeTesting.types';
import { TEST_CATEGORIES, newTestingId } from '../../types/prototypeTesting.types';

interface Props {
  workspace: PrototypeTestingWorkspace;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeTestingWorkspace>) => void;
}

const STATUSES: TestCaseStatus[] = ['draft', 'pending', 'running', 'passed', 'failed', 'blocked'];
const PRIORITIES: TestCasePriority[] = ['low', 'medium', 'high', 'critical'];

export function TestCaseManager({ workspace, disabled, onChange }: Props) {
  const update = (id: string, patch: Partial<TestCase>) => {
    onChange({
      testCases: workspace.testCases.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const add = () => {
    onChange({
      testCases: [
        ...workspace.testCases,
        {
          id: newTestingId(),
          planId: workspace.testPlans[0]?.id ?? null,
          title: '',
          description: '',
          priority: 'medium',
          category: 'functional',
          expectedResult: '',
          actualResult: '',
          status: 'draft',
          tester: '',
          testedAt: null,
          startedAt: null,
          endedAt: null,
          durationMs: null,
        },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ testCases: workspace.testCases.filter((c) => c.id !== id) });
  };

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head">
        <h2>Test case management</h2>
        <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={add}>
          + Add case
        </button>
      </header>

      {workspace.testCases.length === 0 ? (
        <p className="proto-muted">No test cases defined. Add cases or import from a test plan.</p>
      ) : (
        <div className="proto-test-case-table-wrap">
          <table className="proto-test-case-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Tester</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {workspace.testCases.map((tc) => (
                <tr key={tc.id}>
                  <td>
                    <input value={tc.title} disabled={disabled} placeholder="Title" onChange={(e) => update(tc.id, { title: e.target.value })} />
                    <textarea rows={1} value={tc.description} disabled={disabled} placeholder="Description" onChange={(e) => update(tc.id, { description: e.target.value })} />
                  </td>
                  <td>
                    <select value={tc.category} disabled={disabled} onChange={(e) => update(tc.id, { category: e.target.value as TestCategory })}>
                      {TEST_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select value={tc.priority} disabled={disabled} onChange={(e) => update(tc.id, { priority: e.target.value as TestCasePriority })}>
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select value={tc.status} disabled={disabled} onChange={(e) => update(tc.id, { status: e.target.value as TestCaseStatus, testedAt: new Date().toISOString() })}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input value={tc.tester} disabled={disabled} placeholder="Tester" onChange={(e) => update(tc.id, { tester: e.target.value })} />
                  </td>
                  <td>
                    <button type="button" className="proto-btn proto-btn--ghost" disabled={disabled} onClick={() => remove(tc.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
