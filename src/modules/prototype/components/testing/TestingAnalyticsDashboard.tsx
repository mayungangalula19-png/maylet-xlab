import { useState } from 'react';
import type { PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';
import type { TestingKPIs } from '../../utils/testingCenter.utils';

interface Props {
  workspace: PrototypeTestingWorkspace;
  kpis: TestingKPIs;
}

function MiniChart({ values, title }: { values: number[]; title: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="proto-test-chart">
      <h4>{title}</h4>
      <div className="proto-test-chart__bars">
        {values.map((v, i) => (
          <div key={i} className="proto-test-chart__col">
            <div className="proto-test-chart__bar" style={{ height: `${Math.round((v / max) * 100)}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TestingAnalyticsDashboard({ workspace, kpis }: Props) {
  const passTrend = workspace.testCases.slice(0, 6).map((c) => (c.status === 'passed' ? 1 : 0));
  const defectTrend = workspace.defects.slice(0, 6).map(() => 1);

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head"><h2>Analytics & insights</h2></header>
      <div className="proto-test-analytics-grid">
        <MiniChart title="Pass trend" values={passTrend.length ? passTrend : [kpis.passed]} />
        <MiniChart title="Defect trend" values={defectTrend.length ? defectTrend : [workspace.defects.length]} />
        <div className="proto-test-chart proto-test-chart--summary">
          <h4>Summary</h4>
          <ul>
            <li>Pass rate: {kpis.passRate}%</li>
            <li>Quality: {kpis.qualityScore}%</li>
            <li>Open defects: {workspace.defects.filter((d) => d.status === 'open').length}</li>
            <li>Security findings: {workspace.security.length}</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function TestingCollaborationHub({
  workspace,
  onAddComment,
}: {
  workspace: PrototypeTestingWorkspace;
  onAddComment: (text: string) => void;
}) {
  const [text, setText] = useState('');
  return (
    <div className="proto-test-collab">
      <h3>Collaboration</h3>
      <textarea rows={2} value={text} placeholder="Comment or @mention" onChange={(e) => setText(e.target.value)} />
      <button type="button" className="proto-btn proto-btn--secondary" disabled={!text.trim()} onClick={() => { onAddComment(text); setText(''); }}>
        Post
      </button>
      {workspace.comments.slice(0, 5).map((c) => (
        <div key={c.id} className="proto-test-collab__item"><strong>{c.author}</strong><p>{c.text}</p></div>
      ))}
    </div>
  );
}
