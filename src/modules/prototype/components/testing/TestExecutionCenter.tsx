import { useState } from 'react';
import type { PrototypeTestRun } from '../../types/prototype.types';
import type { PrototypeTestingWorkspace, TestCase } from '../../types/prototypeTesting.types';

interface Props {
  workspace: PrototypeTestingWorkspace;
  dbRuns: PrototypeTestRun[];
  disabled?: boolean;
  onRecord: (payload: { name: string; verdict: 'pass' | 'fail' | 'partial'; score?: number; notes?: string }) => void;
  onChange: (patch: Partial<PrototypeTestingWorkspace>) => void;
  onBulkRun: () => void;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function TestExecutionCenter({ workspace, dbRuns, disabled, onRecord, onChange, onBulkRun }: Props) {
  const [log, setLog] = useState<string[]>([]);
  const running = workspace.testCases.filter((c) => c.status === 'running');

  const patchCase = (id: string, patch: Partial<TestCase>) => {
    onChange({ testCases: workspace.testCases.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  };

  const execute = (tc: TestCase) => {
    const startedAt = new Date().toISOString();
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] START ${tc.title}`, ...prev]);
    patchCase(tc.id, { status: 'running', startedAt });

    setTimeout(() => {
      const endedAt = new Date().toISOString();
      const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
      patchCase(tc.id, {
        status: 'passed',
        endedAt,
        durationMs,
        testedAt: endedAt,
        actualResult: 'Pass criteria met',
      });
      setLog((prev) => [
        `[${new Date().toLocaleTimeString()}] PASS ${tc.title} (${formatDuration(durationMs)})`,
        ...prev,
      ]);
    }, 500);
  };

  const completed = workspace.testCases.filter((c) => c.durationMs != null);

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head">
        <h2>Test execution center</h2>
        <button type="button" className="proto-btn proto-btn--primary" disabled={disabled} onClick={onBulkRun}>
          Bulk execute pending
        </button>
      </header>

      <div className="proto-test-exec-grid">
        <div>
          <h3>Manual execution</h3>
          <ul className="proto-test-exec-list">
            {workspace.testCases
              .filter((c) => c.status === 'pending' || c.status === 'draft')
              .slice(0, 8)
              .map((tc) => (
                <li key={tc.id}>
                  <span>{tc.title || 'Untitled'}</span>
                  <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={() => execute(tc)}>
                    Run
                  </button>
                </li>
              ))}
          </ul>
          {running.length > 0 ? <p className="proto-muted">{running.length} test(s) running…</p> : null}

          <h3>Automated execution</h3>
          <p className="proto-muted proto-test-auto-placeholder">
            CI/CD and automated test runner integration — connect via API (placeholder).
          </p>
        </div>

        <div className="proto-test-log">
          <h3>Live execution log</h3>
          <pre>{log.length ? log.join('\n') : 'No executions yet.'}</pre>
        </div>
      </div>

      {completed.length > 0 ? (
        <>
          <h3>Execution history</h3>
          <table className="proto-table">
            <thead>
              <tr><th>Test</th><th>Start</th><th>End</th><th>Duration</th><th>Outcome</th></tr>
            </thead>
            <tbody>
              {completed.slice(0, 10).map((tc) => (
                <tr key={tc.id}>
                  <td>{tc.title}</td>
                  <td>{tc.startedAt ? new Date(tc.startedAt).toLocaleTimeString() : '—'}</td>
                  <td>{tc.endedAt ? new Date(tc.endedAt).toLocaleTimeString() : '—'}</td>
                  <td>{tc.durationMs != null ? formatDuration(tc.durationMs) : '—'}</td>
                  <td className={`proto-verdict proto-verdict--${tc.status === 'passed' ? 'pass' : tc.status}`}>{tc.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      <h3>Persisted test runs ({dbRuns.length})</h3>
      {dbRuns.length === 0 ? (
        <p className="proto-muted">Record results below to persist test runs to the database.</p>
      ) : (
        <table className="proto-table">
          <thead>
            <tr><th>Test</th><th>Verdict</th><th>Score</th><th>Date</th></tr>
          </thead>
          <tbody>
            {dbRuns.map((t) => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td className={`proto-verdict proto-verdict--${t.verdict}`}>{t.verdict}</td>
                <td>{t.score ?? '—'}</td>
                <td>{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <QuickRecord disabled={disabled} onRecord={onRecord} />
    </section>
  );
}

function QuickRecord({
  disabled,
  onRecord,
}: {
  disabled?: boolean;
  onRecord: Props['onRecord'];
}) {
  const [name, setName] = useState('');
  const [verdict, setVerdict] = useState<'pass' | 'fail' | 'partial'>('pass');
  const [score, setScore] = useState('80');
  const [notes, setNotes] = useState('');

  return (
    <div className="proto-test-quick-record">
      <h3>Submit test result</h3>
      <div className="proto-form-grid">
        <input value={name} placeholder="Test name" onChange={(e) => setName(e.target.value)} />
        <select value={verdict} onChange={(e) => setVerdict(e.target.value as typeof verdict)}>
          <option value="pass">Pass</option>
          <option value="partial">Partial</option>
          <option value="fail">Fail</option>
        </select>
        <input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} />
        <textarea rows={2} value={notes} placeholder="Notes" onChange={(e) => setNotes(e.target.value)} />
        <button
          type="button"
          className="proto-btn proto-btn--secondary"
          disabled={disabled || !name.trim()}
          onClick={() => {
            onRecord({ name, verdict, score: Number(score), notes });
            setName('');
            setNotes('');
          }}
        >
          Submit result
        </button>
      </div>
    </div>
  );
}
