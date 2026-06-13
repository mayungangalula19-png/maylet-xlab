import type { AnalyticsChartData } from '../../../lib/innovation/dashboardAnalytics';

interface Props {
  charts: AnalyticsChartData;
}

function MiniChart({ title, data, color }: { title: string; data: { label: string; value: number }[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="icc-analytics-chart">
      <h4>{title}</h4>
      <div className="icc-chart-bars">
        {data.map((point) => (
          <div key={point.label} className="icc-chart-bar-col" title={`${point.label}: ${point.value}`}>
            <div
              className="icc-chart-bar"
              style={{ height: `${(point.value / max) * 100}%`, background: color }}
            />
            <span className="icc-chart-label">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsCenter({ charts }: Props) {
  return (
    <div className="icc-glass icc-analytics-center">
      <h3>Analytics Center</h3>
      <div className="icc-analytics-grid">
        <MiniChart title="Innovation Trends" data={charts.innovationTrends} color="#7c5fe6" />
        <MiniChart title="Research Activity" data={charts.researchActivity} color="#2fd4ff" />
        <MiniChart title="Funding Progress" data={charts.fundingProgress} color="#f093fb" />
        <MiniChart title="Experiment Results" data={charts.experimentResults} color="#f6c90e" />
        <MiniChart title="Team Productivity" data={charts.teamProductivity} color="#4facfe" />
        <MiniChart title="Commercialization" data={charts.commercializationProgress} color="#48bb78" />
      </div>
    </div>
  );
}
