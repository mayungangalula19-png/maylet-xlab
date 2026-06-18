import type { CommandCenterKPIs, PipelineStageMetrics, PortfolioItem } from '../../types/commandCenter.types';
import { INNOVATION_STAGES } from '../../types/commandCenter.types';

interface Props {
  kpis: CommandCenterKPIs;
  pipeline: PipelineStageMetrics[];
  portfolio: PortfolioItem[];
  onExport: () => void;
}

function SimpleBarChart({ labels, values, title }: { labels: string[]; values: number[]; title: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="proto-cc-chart">
      <h4>{title}</h4>
      <div className="proto-cc-chart__bars">
        {labels.map((label, i) => (
          <div key={label} className="proto-cc-chart__col">
            <div className="proto-cc-chart__bar" style={{ height: `${Math.round((values[i] / max) * 100)}%` }} />
            <span>{label}</span>
            <em>{values[i]}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsDashboard({ kpis, pipeline, portfolio, onExport }: Props) {
  const stageCounts = INNOVATION_STAGES.map((s) => portfolio.filter((p) => p.stage === s.id).length);
  const industryMap = new Map<string, number>();
  portfolio.forEach((p) => {
    const ind = p.meta.industry || 'Other';
    industryMap.set(ind, (industryMap.get(ind) ?? 0) + 1);
  });
  const industries = [...industryMap.entries()].slice(0, 5);

  return (
    <section className="proto-cc-analytics">
      <header className="proto-cc-section-head">
        <div>
          <h2>Analytics & reporting</h2>
          <p>Portfolio trends and distribution</p>
        </div>
        <button type="button" className="proto-btn proto-btn--secondary" onClick={onExport}>
          Export report
        </button>
      </header>
      <div className="proto-cc-analytics__grid">
        <SimpleBarChart
          title="Pipeline distribution"
          labels={INNOVATION_STAGES.map((s) => s.label.slice(0, 6))}
          values={stageCounts}
        />
        <SimpleBarChart
          title="Validation trend"
          labels={['Pass', 'Pending', 'Risk']}
          values={[kpis.fundingReady, kpis.inValidation, kpis.highRisk]}
        />
        {industries.length > 0 ? (
          <SimpleBarChart title="Industry mix" labels={industries.map(([k]) => k.slice(0, 8))} values={industries.map(([, v]) => v)} />
        ) : null}
        <div className="proto-cc-chart proto-cc-chart--summary">
          <h4>Executive snapshot</h4>
          <ul>
            <li>Growth (30d): +{kpis.growthPct}%</li>
            <li>Health score: {kpis.innovationHealth}</li>
            <li>Bottleneck stage: {pipeline.find((p) => p.bottleneck)?.label ?? 'None'}</li>
            <li>Avg success rate: {pipeline.length ? Math.round(pipeline.reduce((s, p) => s + p.successRate, 0) / pipeline.length) : 0}%</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
