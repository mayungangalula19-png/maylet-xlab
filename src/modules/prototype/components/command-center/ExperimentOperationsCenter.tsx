import type { PortfolioItem } from '../../types/commandCenter.types';

interface Props {
  running: PortfolioItem[];
  completed: PortfolioItem[];
  failedAssumptions: number;
  total: number;
}

export function ExperimentOperationsCenter({ running, completed, failedAssumptions, total }: Props) {
  return (
    <section className="proto-cc-center">
      <header className="proto-cc-center__head">
        <h3>Experiment operations</h3>
        <span className="proto-cc-center__badge">{total} total</span>
      </header>
      <div className="proto-cc-gauges">
        <div className="proto-cc-gauge">
          <strong>{running.length}</strong>
          <span>Running</span>
        </div>
        <div className="proto-cc-gauge">
          <strong>{completed.length}</strong>
          <span>Completed</span>
        </div>
        <div className="proto-cc-gauge proto-cc-gauge--warn">
          <strong>{failedAssumptions}</strong>
          <span>Open assumptions</span>
        </div>
      </div>
      {running.length > 0 ? (
        <ul className="proto-cc-mini-list">
          {running.slice(0, 3).map((p) => (
            <li key={p.prototype.id}>
              <strong>{p.prototype.name}</strong>
              <span>{p.meta.experiments.length} experiments</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="proto-muted">No active experiment tracks.</p>
      )}
    </section>
  );
}
