import type { PrototypeTestingWorkspace } from '../../types/prototypeTesting.types';
import { newTestingId } from '../../types/prototypeTesting.types';

interface Props {
  workspace: PrototypeTestingWorkspace;
  disabled?: boolean;
  onChange: (patch: Partial<PrototypeTestingWorkspace>) => void;
}

export function PerformanceTestingCenter({ workspace, disabled, onChange }: Props) {
  const latest = workspace.performance[0];
  const add = () => {
    onChange({
      performance: [
        { id: newTestingId(), responseTimeMs: null, loadTimeMs: null, throughput: null, resourceUsage: '', reliability: '', recordedAt: new Date().toISOString() },
        ...workspace.performance,
      ],
    });
  };

  return (
    <section className="proto-test-panel">
      <header className="proto-test-panel__head">
        <h2>Performance testing</h2>
        <button type="button" className="proto-btn proto-btn--secondary" disabled={disabled} onClick={add}>+ Record metrics</button>
      </header>
      {latest ? (
        <div className="proto-test-perf-cards">
          <div><strong>{latest.responseTimeMs ?? '—'}ms</strong><span>Response time</span></div>
          <div><strong>{latest.loadTimeMs ?? '—'}ms</strong><span>Load time</span></div>
          <div><strong>{latest.throughput ?? '—'}</strong><span>Throughput</span></div>
        </div>
      ) : null}
      {workspace.performance.slice(0, 3).map((m) => (
        <div key={m.id} className="proto-test-perf-row">
          <input type="number" placeholder="Response ms" value={m.responseTimeMs ?? ''} onChange={(e) => onChange({ performance: workspace.performance.map((x) => x.id === m.id ? { ...x, responseTimeMs: e.target.value === '' ? null : Number(e.target.value) } : x) })} />
          <input type="number" placeholder="Load ms" value={m.loadTimeMs ?? ''} onChange={(e) => onChange({ performance: workspace.performance.map((x) => x.id === m.id ? { ...x, loadTimeMs: e.target.value === '' ? null : Number(e.target.value) } : x) })} />
          <input placeholder="Resource usage" value={m.resourceUsage} onChange={(e) => onChange({ performance: workspace.performance.map((x) => x.id === m.id ? { ...x, resourceUsage: e.target.value } : x) })} />
        </div>
      ))}
      {workspace.performance.length > 1 ? (
        <div className="proto-test-chart">
          <h4>Response time trend</h4>
          <div className="proto-test-chart__bars">
            {[...workspace.performance].reverse().slice(0, 6).map((m) => (
              <div key={m.id} className="proto-test-chart__col">
                <div className="proto-test-chart__bar" style={{ height: `${Math.min(100, (m.responseTimeMs ?? 0) / 5)}%` }} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
