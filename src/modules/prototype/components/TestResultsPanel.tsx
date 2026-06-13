import { useState } from 'react';
import type { PrototypeTestRun } from '../types/prototype.types';

interface Props {
  tests: PrototypeTestRun[];
  onRecord?: (payload: { name: string; verdict: 'pass' | 'fail' | 'partial'; score: number; notes: string }) => void;
}

export function TestResultsPanel({ tests, onRecord }: Props) {
  const [name, setName] = useState('');
  const [verdict, setVerdict] = useState<'pass' | 'fail' | 'partial'>('pass');
  const [score, setScore] = useState('80');
  const [notes, setNotes] = useState('');

  return (
    <div className="proto-panel">
      <h3>Test results</h3>
      {tests.length === 0 ? (
        <p className="proto-empty">No test runs recorded.</p>
      ) : (
        <table className="proto-table">
          <thead>
            <tr><th>Test</th><th>Verdict</th><th>Score</th><th>Date</th></tr>
          </thead>
          <tbody>
            {tests.map((t) => (
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

      {onRecord && (
        <div className="proto-form-grid" style={{ marginTop: '1rem' }}>
          <input placeholder="Test name" value={name} onChange={(e) => setName(e.target.value)} />
          <select value={verdict} onChange={(e) => setVerdict(e.target.value as typeof verdict)}>
            <option value="pass">Pass</option>
            <option value="partial">Partial</option>
            <option value="fail">Fail</option>
          </select>
          <input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} />
          <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          <button
            type="button"
            className="proto-btn proto-btn--secondary"
            onClick={() => {
              if (!name.trim()) return;
              onRecord({ name, verdict, score: Number(score), notes });
              setName('');
              setNotes('');
            }}
          >
            Record test
          </button>
        </div>
      )}
    </div>
  );
}
