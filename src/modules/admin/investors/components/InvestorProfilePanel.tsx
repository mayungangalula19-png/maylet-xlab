import { memo, useEffect, useState } from 'react';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { fetchInvestorActivity } from '../services/investors.service';
import { formatAdminCurrency, formatAdminDateTime } from '../../utils/adminPage.utils';
import type { Deal, Investor, InvestorActivityEvent } from '../types/investorOps.types';

interface InvestorProfilePanelProps {
  investor: Investor | null;
  deals: Deal[];
  open: boolean;
  onClose: () => void;
}

function scoreColor(score: number): string {
  if (score >= 75) return '#48bb78';
  if (score >= 50) return '#f6c90e';
  return '#fc8181';
}

export const InvestorProfilePanel = memo(function InvestorProfilePanel({
  investor,
  deals,
  open,
  onClose,
}: InvestorProfilePanelProps) {
  const [activity, setActivity] = useState<InvestorActivityEvent[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    if (!open || !investor) return;
    setLoadingActivity(true);
    void fetchInvestorActivity(investor.id).then((result) => {
      setActivity(result.data ?? []);
      setLoadingActivity(false);
    });
  }, [open, investor]);

  if (!open || !investor) return null;

  const investorDeals = deals.filter((d) => d.investorId === investor.id);

  return (
    <div className="admin-drawer-overlay" role="dialog" aria-modal="true">
      <div className="admin-drawer admin-drawer--wide admin-investor-profile-panel">
        <div className="admin-drawer-header">
          <div>
            <h3>{investor.name}</h3>
            <p className="admin-muted">{investor.email || 'No email'} · {investor.type.toUpperCase()}</p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost admin-btn--xs" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="admin-investor-profile-scores">
          <div className="admin-investor-score-ring" style={{ borderColor: scoreColor(investor.investorScore) }}>
            <span className="admin-investor-score-value">{investor.investorScore}</span>
            <span className="admin-investor-score-label">AI Score</span>
          </div>
          <div className="admin-investor-profile-metrics">
            <div><strong>Engagement</strong> {investor.engagementScore}/100</div>
            <div><strong>Risk</strong> {investor.riskScore}/100</div>
            <div><strong>Invested</strong> {formatAdminCurrency(investor.totalInvested)}</div>
            <div><strong>Active deals</strong> {investor.activeDeals}</div>
            <div><strong>Check size</strong> {formatAdminCurrency(investor.investmentRangeMin)} – {formatAdminCurrency(investor.investmentRangeMax)}</div>
            <div><strong>Last activity</strong> {formatAdminDateTime(investor.lastActivity)}</div>
          </div>
        </div>

        {investor.tags.length > 0 ? (
          <div className="admin-investor-tags">
            {investor.tags.map((tag) => (
              <span key={tag} className="admin-investor-tag">{tag}</span>
            ))}
          </div>
        ) : null}

        <section className="admin-investor-profile-section">
          <h4>Deal pipeline ({investorDeals.length})</h4>
          {investorDeals.length === 0 ? (
            <p className="admin-muted">No deals linked to this investor.</p>
          ) : (
            <ul className="admin-investor-deal-list">
              {investorDeals.map((deal) => (
                <li key={deal.id}>
                  <strong>{deal.title}</strong>
                  <span>{formatAdminCurrency(deal.amount)} · {deal.stage} · {deal.probabilityScore}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-investor-profile-section">
          <h4>Activity timeline</h4>
          {loadingActivity ? (
            <AdminLoadingState label="Loading activity…" compact />
          ) : activity.length === 0 ? (
            <p className="admin-muted">No recent activity.</p>
          ) : (
            <ul className="admin-investor-timeline">
              {activity.map((event) => (
                <li key={event.id}>
                  <span className="admin-investor-timeline-time">{formatAdminDateTime(event.timestamp)}</span>
                  <span>{event.label}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
});
