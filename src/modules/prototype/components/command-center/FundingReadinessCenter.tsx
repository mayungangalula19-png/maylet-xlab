import type { PortfolioItem } from '../../types/commandCenter.types';

interface Props {
  ready: PortfolioItem[];
  avgInvestor: number;
  avgMarket: number;
  count: number;
}

export function FundingReadinessCenter({ ready, avgInvestor, avgMarket, count }: Props) {
  return (
    <section className="proto-cc-center">
      <header className="proto-cc-center__head">
        <h3>Funding readiness</h3>
        <span className="proto-cc-center__badge">{count} ready</span>
      </header>
      <div className="proto-cc-gauges">
        <div className="proto-cc-gauge proto-cc-gauge--primary">
          <strong>{avgInvestor}%</strong>
          <span>Investor readiness</span>
        </div>
        <div className="proto-cc-gauge">
          <strong>{avgMarket}%</strong>
          <span>Market readiness</span>
        </div>
        <div className="proto-cc-gauge">
          <strong>{ready.length ? Math.round(ready.reduce((s, p) => s + p.completion, 0) / ready.length) : 0}%</strong>
          <span>Product readiness</span>
        </div>
      </div>
      <p className="proto-cc-recommendation">
        {count >= 3
          ? 'Portfolio has funding-ready candidates — schedule investor review sessions.'
          : count > 0
            ? 'Strengthen validation evidence before fundraising outreach.'
            : 'Focus on validation milestones to unlock funding readiness.'}
      </p>
    </section>
  );
}
