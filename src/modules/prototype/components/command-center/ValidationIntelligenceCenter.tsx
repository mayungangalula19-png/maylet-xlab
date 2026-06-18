import type { PortfolioItem } from '../../types/commandCenter.types';

interface Props {
  pending: PortfolioItem[];
  failed: PortfolioItem[];
  successRate: number;
  queue: number;
}

export function ValidationIntelligenceCenter({ pending, failed, successRate, queue }: Props) {
  return (
    <section className="proto-cc-center">
      <header className="proto-cc-center__head">
        <h3>Validation intelligence</h3>
        <span className="proto-cc-center__badge">{queue} in queue</span>
      </header>
      <div className="proto-cc-gauges">
        <div className="proto-cc-gauge">
          <strong>{successRate}%</strong>
          <span>Success rate</span>
        </div>
        <div className="proto-cc-gauge proto-cc-gauge--warn">
          <strong>{pending.length}</strong>
          <span>Pending review</span>
        </div>
        <div className="proto-cc-gauge proto-cc-gauge--danger">
          <strong>{failed.length}</strong>
          <span>Failed</span>
        </div>
      </div>
      <div className="proto-cc-radar">
        {['Problem fit', 'UX', 'Tech', 'Market', 'Traction'].map((axis, i) => (
          <div key={axis} className="proto-cc-radar__axis">
            <span>{axis}</span>
            <div className="proto-cc-radar__bar" style={{ width: `${60 + i * 8}%` }} />
          </div>
        ))}
      </div>
    </section>
  );
}
