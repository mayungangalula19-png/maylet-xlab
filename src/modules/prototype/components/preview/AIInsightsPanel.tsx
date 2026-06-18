import type { PrototypeRecommendation } from '../../ai/recommendationEngine';
import type { CommercialReadiness } from '../../types/prototypePreview.types';

interface Props {
  recommendation: PrototypeRecommendation | null;
  commercial: CommercialReadiness | null;
}

export function AIInsightsPanel({ recommendation, commercial }: Props) {
  const eval_ = recommendation?.evaluation;

  return (
    <aside className="proto-preview-aside" aria-label="AI insights">
      <div className="proto-preview-aside__block">
        <h2>AI insights</h2>
        <p className="proto-muted">Prototype analysis powered by MAYLET risk engine.</p>
      </div>

      {recommendation ? (
        <>
          <div className="proto-preview-aside__block">
            <h3>Prototype analysis</h3>
            <div className="proto-preview-ai-score">
              <span>Readiness</span>
              <strong>{recommendation.readinessScore}%</strong>
            </div>
            <p className={`proto-preview-ai-rec proto-preview-ai-rec--${eval_?.recommendation?.toLowerCase()}`}>
              {eval_?.recommendation ?? 'HOLD'}
            </p>
            <p className="proto-preview-ai-next">{recommendation.nextAction}</p>
          </div>

          {eval_?.explanation ? (
            <div className="proto-preview-aside__block">
              <h3>Risk detection</h3>
              <p>{eval_.explanation}</p>
              <span className="proto-preview-ai-risk">Risk score: {eval_.riskScore}/100</span>
            </div>
          ) : null}

          {eval_?.improvements?.length ? (
            <div className="proto-preview-aside__block">
              <h3>Improvements</h3>
              <ul className="proto-preview-ai-list">
                {eval_.improvements.slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {eval_?.failurePoints?.length ? (
            <div className="proto-preview-aside__block">
              <h3>Failure points</h3>
              <ul className="proto-preview-ai-list proto-preview-ai-list--warn">
                {eval_.failurePoints.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <p className="proto-muted">Loading analysis…</p>
      )}

      {commercial ? (
        <div className="proto-preview-aside__block">
          <h3>Funding & commercialization</h3>
          <ul className="proto-preview-ai-list">
            <li>Market: {commercial.marketScore}% ({commercial.market})</li>
            <li>Funding readiness: {commercial.fundingScore}%</li>
            <li>Scalability: {commercial.scalabilityScore}%</li>
            {commercial.funding === 'green' ? (
              <li>Strong candidate for funding conversations</li>
            ) : commercial.funding === 'yellow' ? (
              <li>Strengthen validation before investor outreach</li>
            ) : (
              <li>Address risk factors before commercialization</li>
            )}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
