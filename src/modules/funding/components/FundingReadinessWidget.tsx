import { Link } from 'react-router-dom';
import type { FundingReadinessDetail } from '../../../lib/innovation/recommendations';

interface Props {
  items: FundingReadinessDetail[];
}

export function FundingReadinessWidget({ items }: Props) {
  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Funding Readiness</h3>
        <Link to="/funding" className="icc-widget-link">Funding Hub</Link>
      </div>
      {items.length === 0 ? (
        <>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
            Create a project to assess funding readiness and investment potential.
          </p>
          <Link to="/funding" className="icc-widget-cta">Explore funding sources →</Link>
        </>
      ) : (
        items.map((item) => (
          <Link key={item.projectId} to={item.route} className="icc-funding-readiness-item icc-clickable">
            <div className="icc-fr-header">
              <strong>{item.projectName}</strong>
              <span className="icc-match-score">{item.fundingReadiness}% ready</span>
            </div>
            <div className="icc-fr-scores">
              <span>Investment potential: <strong>{item.investmentPotential}%</strong></span>
            </div>
            {item.missingRequirements.length > 0 && (
              <div className="icc-fr-missing">
                Missing: {item.missingRequirements.join(', ')}
              </div>
            )}
            <div className="icc-fr-sources">
              Sources: {item.recommendedSources.join(' · ')}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
