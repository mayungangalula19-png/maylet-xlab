import { memo } from 'react';
import type { AIInsight, Investor } from '../types/investorOps.types';
import { formatAdminDateTime } from '../../utils/adminPage.utils';

interface InvestorAIInsightsPanelProps {
  insights: AIInsight[];
  computing: boolean;
  suggestedContact: Investor | null;
  hotLeads: Investor[];
  portfolioRiskScore: number;
  onSelectInvestor?: (id: string) => void;
  recentEvents?: Array<{ type: string; at: string }>;
}

function severityIcon(severity: AIInsight['severity']): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'warning':
      return '⚠️';
    case 'success':
      return '✨';
    default:
      return '💡';
  }
}

export const InvestorAIInsightsPanel = memo(function InvestorAIInsightsPanel({
  insights,
  computing,
  suggestedContact,
  hotLeads,
  portfolioRiskScore,
  onSelectInvestor,
  recentEvents = [],
}: InvestorAIInsightsPanelProps) {
  return (
    <aside className="admin-investor-ai-panel">
      <div className="admin-investor-ai-header">
        <h3>AI Intelligence</h3>
        {computing ? <span className="admin-investor-ai-streaming">Analyzing…</span> : null}
      </div>

      <div className="admin-investor-ai-risk">
        <span>Portfolio risk</span>
        <strong>{portfolioRiskScore}/100</strong>
      </div>

      {suggestedContact ? (
        <div className="admin-investor-ai-suggestion">
          <span className="admin-investor-ai-suggestion-label">Next contact</span>
          <button
            type="button"
            className="admin-link-button"
            onClick={() => onSelectInvestor?.(suggestedContact.id)}
          >
            {suggestedContact.name}
          </button>
          <span className="admin-muted">Score {suggestedContact.investorScore}</span>
        </div>
      ) : null}

      {hotLeads.length > 0 ? (
        <div className="admin-investor-ai-hot">
          <span className="admin-investor-ai-section-title">Hot leads ({hotLeads.length})</span>
          {hotLeads.slice(0, 4).map((inv) => (
            <button
              key={inv.id}
              type="button"
              className="admin-investor-hot-chip"
              onClick={() => onSelectInvestor?.(inv.id)}
            >
              {inv.name} · {inv.investorScore}
            </button>
          ))}
        </div>
      ) : null}

      <div className="admin-investor-ai-insights">
        <span className="admin-investor-ai-section-title">Insights</span>
        {insights.length === 0 && !computing ? (
          <p className="admin-muted">No insights yet. Add investors and deals to activate AI engine.</p>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className={`admin-investor-insight admin-investor-insight--${insight.severity}`}
              role="button"
              tabIndex={0}
              onClick={() => insight.investorId && onSelectInvestor?.(insight.investorId)}
              onKeyDown={(e) =>
                e.key === 'Enter' && insight.investorId && onSelectInvestor?.(insight.investorId)
              }
            >
              <div className="admin-investor-insight-head">
                <span>{severityIcon(insight.severity)}</span>
                <strong>{insight.title}</strong>
              </div>
              <p>{insight.message}</p>
              {insight.score !== undefined ? (
                <span className="admin-investor-insight-score">Score {insight.score}</span>
              ) : null}
            </div>
          ))
        )}
      </div>

      {recentEvents.length > 0 ? (
        <div className="admin-investor-ai-feed">
          <span className="admin-investor-ai-section-title">Live feed</span>
          {recentEvents.slice(0, 5).map((ev, i) => (
            <div key={`${ev.type}-${ev.at}-${i}`} className="admin-investor-feed-item">
              <span className="admin-muted">{formatAdminDateTime(ev.at)}</span>
              <span>{ev.type.replace(':', ' ')}</span>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
});
