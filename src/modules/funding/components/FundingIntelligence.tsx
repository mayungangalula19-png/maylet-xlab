import { Link } from 'react-router-dom';
import type { FundingMatch } from '../../../lib/supabase/commandCenter.queries';

interface Props {
  matches: FundingMatch[];
}

const TYPE_LABELS: Record<FundingMatch['type'], string> = {
  grant: 'Grant',
  fund: 'Fund',
  investor: 'Investor',
  accelerator: 'Accelerator',
  challenge: 'Competition',
};

function formatDeadline(deadline: string) {
  if (deadline === 'Rolling') return deadline;
  try {
    return new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return deadline;
  }
}

export function FundingIntelligence({ matches }: Props) {
  return (
    <div className="icc-glass icc-widget icc-funding-intel">
      <div className="icc-widget-header">
        <h3>Funding Intelligence</h3>
        <Link to="/funding" className="icc-widget-link">Explore All</Link>
      </div>

      <div className="icc-funding-intel-list">
        {matches.map((match) => (
          <Link key={match.id} to="/funding" className="icc-funding-intel-card icc-clickable">
            <div className="icc-funding-intel-header">
              <span className="icc-funding-type">{TYPE_LABELS[match.type]}</span>
              <span className="icc-funding-match">{match.matchScore}% match</span>
            </div>
            <h4>{match.title}</h4>
            <p>{match.description}</p>
            <div className="icc-funding-intel-meta">
              <span><strong>Eligibility:</strong> {match.eligibility ?? 'Not Available Yet'}</span>
              <span><strong>Amount:</strong> {match.fundingAmount ?? 'Not Available Yet'}</span>
              <span><strong>Deadline:</strong> {formatDeadline(match.deadline ?? 'Not Available Yet')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
