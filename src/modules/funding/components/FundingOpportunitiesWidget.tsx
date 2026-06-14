import { Link } from 'react-router-dom';
import type { FundingMatch } from '../../../lib/supabase/commandCenter.queries';

interface Props {
  matches: FundingMatch[];
}

const TYPE_LABELS: Record<FundingMatch['type'], string> = {
  grant: 'Grant',
  fund: 'Innovation Fund',
  investor: 'Investor',
  accelerator: 'Accelerator',
  challenge: 'Innovation Challenge',
};

export function FundingOpportunitiesWidget({ matches }: Props) {
  return (
    <div className="icc-glass icc-widget">
      <div className="icc-widget-header">
        <h3>Funding Hub</h3>
        <Link to="/funding" className="icc-widget-link">Funding Hub</Link>
      </div>
      {matches.map((m) => (
        <Link
          key={m.id}
          to="/funding"
          className="icc-funding-item icc-clickable"
          title={`View ${m.title} in Funding Hub`}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>{m.title}</strong>
            <span className="icc-match-score">{m.matchScore}% match</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            {TYPE_LABELS[m.type]} — {m.description}
          </div>
        </Link>
      ))}
      <Link to="/funding/create" className="icc-widget-cta">
        Search more funding opportunities →
      </Link>
    </div>
  );
}
