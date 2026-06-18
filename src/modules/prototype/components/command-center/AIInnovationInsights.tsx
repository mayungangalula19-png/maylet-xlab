import { Link } from 'react-router-dom';
import type { PortfolioItem } from '../../types/commandCenter.types';

interface Props {
  highPotential: PortfolioItem[];
  stalled: PortfolioItem[];
  portfolio: PortfolioItem[];
}

export function AIInnovationInsights({ highPotential, stalled, portfolio }: Props) {
  const top = highPotential[0];

  return (
    <aside className="proto-cc-ai" aria-label="AI innovation insights">
      <header className="proto-cc-ai__head">
        <h2>AI intelligence</h2>
        <p>Portfolio analysis & recommendations</p>
      </header>

      {top ? (
        <div className="proto-cc-ai__block">
          <h3>High potential</h3>
          <Link to={`/prototypes/${top.prototype.id}/preview`} className="proto-cc-ai__highlight">
            {top.prototype.name}
          </Link>
          <span>Readiness {top.readinessIndex}%</span>
        </div>
      ) : null}

      {stalled.length > 0 ? (
        <div className="proto-cc-ai__block proto-cc-ai__block--warn">
          <h3>Stalled projects ({stalled.length})</h3>
          <ul>
            {stalled.slice(0, 3).map((p) => (
              <li key={p.prototype.id}>{p.prototype.name}</li>
            ))}
          </ul>
          <p>No activity in 14+ days — suggest validation sprint.</p>
        </div>
      ) : null}

      <div className="proto-cc-ai__block">
        <h3>Opportunities</h3>
        <ul className="proto-cc-ai-list">
          <li>Run experiments on {portfolio.filter((p) => p.meta.experiments.length === 0).length} prototypes without hypotheses</li>
          <li>{portfolio.filter((p) => p.validationScore < 50).length} need validation plans</li>
          <li>{portfolio.filter((p) => p.fundingScore >= 70).length} funding-ready for investor summary</li>
        </ul>
      </div>

      <div className="proto-cc-ai__block">
        <h3>Risk analysis</h3>
        <p>
          {portfolio.filter((p) => p.riskLevel === 'high').length} high-risk ·{' '}
          {portfolio.filter((p) => p.riskLevel === 'medium').length} medium-risk prototypes
        </p>
      </div>
    </aside>
  );
}
