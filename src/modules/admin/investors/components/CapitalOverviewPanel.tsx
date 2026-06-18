import { memo } from 'react';
import { formatCapitalShort } from '../services/capital.service';

interface CapitalOverviewPanelProps {
  totalCapital: number;
  activeDeals: number;
  successProbability: number;
  committedCapital: number;
  pendingValue: number;
  weightedPipeline: number;
  runwayMonths: number;
}

export const CapitalOverviewPanel = memo(function CapitalOverviewPanel({
  totalCapital,
  activeDeals,
  successProbability,
  committedCapital,
  pendingValue,
  weightedPipeline,
  runwayMonths,
}: CapitalOverviewPanelProps) {
  return (
    <div className="admin-investor-ops-kpis">
      <div className="admin-investor-ops-kpi" style={{ borderTopColor: '#7c5fe6' }}>
        <span className="admin-investor-ops-kpi-label">Total Capital</span>
        <span className="admin-investor-ops-kpi-value">{formatCapitalShort(totalCapital)}</span>
        <span className="admin-investor-ops-kpi-hint">Active investor capacity</span>
      </div>
      <div className="admin-investor-ops-kpi" style={{ borderTopColor: '#2fd4ff' }}>
        <span className="admin-investor-ops-kpi-label">Active Deals</span>
        <span className="admin-investor-ops-kpi-value">{activeDeals}</span>
        <span className="admin-investor-ops-kpi-hint">{formatCapitalShort(pendingValue)} pending</span>
      </div>
      <div className="admin-investor-ops-kpi" style={{ borderTopColor: '#48bb78' }}>
        <span className="admin-investor-ops-kpi-label">Success Probability</span>
        <span className="admin-investor-ops-kpi-value">{successProbability}%</span>
        <span className="admin-investor-ops-kpi-hint">AI-weighted pipeline</span>
      </div>
      <div className="admin-investor-ops-kpi" style={{ borderTopColor: '#f6c90e' }}>
        <span className="admin-investor-ops-kpi-label">Committed</span>
        <span className="admin-investor-ops-kpi-value">{formatCapitalShort(committedCapital)}</span>
        <span className="admin-investor-ops-kpi-hint">Weighted {formatCapitalShort(weightedPipeline)}</span>
      </div>
      <div className="admin-investor-ops-kpi" style={{ borderTopColor: '#fc8181' }}>
        <span className="admin-investor-ops-kpi-label">Runway Insight</span>
        <span className="admin-investor-ops-kpi-value">{runwayMonths}mo</span>
        <span className="admin-investor-ops-kpi-hint">Funding runway estimate</span>
      </div>
    </div>
  );
});
