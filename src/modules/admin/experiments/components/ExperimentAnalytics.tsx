import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { memo, useMemo } from 'react';
import type { ExperimentAnalyticsData } from '../types/experimentOpsAdmin.types';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ExperimentAnalyticsProps {
  data: ExperimentAnalyticsData;
  variant?: 'full' | 'sidebar';
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const, labels: { color: '#a0aec0' } } },
  scales: {
    x: { ticks: { color: '#a0aec0' }, grid: { color: 'rgba(255,255,255,0.06)' } },
    y: { ticks: { color: '#a0aec0' }, grid: { color: 'rgba(255,255,255,0.06)' } },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'right' as const, labels: { color: '#a0aec0', boxWidth: 12 } } },
};

export const ExperimentAnalytics = memo(function ExperimentAnalytics({
  data,
  variant = 'full',
}: ExperimentAnalyticsProps) {
  const successChart = useMemo(
    () => ({
      labels: data.successTrend.map((d) => d.month),
      datasets: [
        {
          label: 'Success Rate %',
          data: data.successTrend.map((d) => d.rate),
          borderColor: '#7c5fe6',
          backgroundColor: 'rgba(124, 95, 230, 0.15)',
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [data.successTrend]
  );

  const budgetChart = useMemo(
    () => ({
      labels: data.budgetVsOutcome.map((d) => d.label),
      datasets: [
        {
          label: 'Budget',
          data: data.budgetVsOutcome.map((d) => d.budget),
          backgroundColor: 'rgba(47, 212, 255, 0.55)',
          borderColor: '#2fd4ff',
          borderWidth: 1,
        },
        {
          label: 'Outcome Value',
          data: data.budgetVsOutcome.map((d) => d.outcome),
          backgroundColor: 'rgba(72, 187, 120, 0.55)',
          borderColor: '#48bb78',
          borderWidth: 1,
        },
      ],
    }),
    [data.budgetVsOutcome]
  );

  const categoryChart = useMemo(
    () => ({
      labels: data.categoryBreakdown.map((d) => d.category),
      datasets: [
        {
          data: data.categoryBreakdown.map((d) => d.count),
          backgroundColor: [
            '#7c5fe6',
            '#2fd4ff',
            '#48bb78',
            '#f6c90e',
            '#fc8181',
            '#9f7aea',
            '#38b2ac',
            '#4299e1',
          ],
          borderWidth: 0,
        },
      ],
    }),
    [data.categoryBreakdown]
  );

  const funnelChart = useMemo(
    () => ({
      labels: data.validationFunnel.map((d) => d.stage),
      datasets: [
        {
          label: 'Experiments',
          data: data.validationFunnel.map((d) => d.count),
          backgroundColor: 'rgba(159, 122, 234, 0.65)',
          borderColor: '#9f7aea',
          borderWidth: 1,
        },
      ],
    }),
    [data.validationFunnel]
  );

  const compactChartOptions = {
    ...chartOptions,
    plugins: { legend: { display: false } },
  };

  if (variant === 'sidebar') {
    return (
      <div className="admin-experiment-analytics-sidebar">
        <div className="admin-experiment-chart-card admin-experiment-glass">
          <h4>Success Rate Trend</h4>
          <div className="admin-experiment-chart-wrap admin-experiment-chart-wrap--sm">
            <Line data={successChart} options={compactChartOptions} />
          </div>
        </div>
        <div className="admin-experiment-chart-card admin-experiment-glass">
          <h4>Budget vs Outcome</h4>
          <div className="admin-experiment-chart-wrap admin-experiment-chart-wrap--sm">
            <Bar data={budgetChart} options={compactChartOptions} />
          </div>
        </div>
        <div className="admin-experiment-chart-card admin-experiment-glass">
          <h4>Experiment Categories</h4>
          <div className="admin-experiment-chart-wrap admin-experiment-chart-wrap--sm admin-experiment-chart-wrap--doughnut">
            <Doughnut data={categoryChart} options={{ ...doughnutOptions, plugins: { legend: { position: 'bottom' as const, labels: { color: '#a0aec0', boxWidth: 10, font: { size: 10 } } } } }} />
          </div>
        </div>
        <div className="admin-experiment-chart-card admin-experiment-glass">
          <h4>Validation Conversion Funnel</h4>
          <div className="admin-experiment-chart-wrap admin-experiment-chart-wrap--sm">
            <Bar data={funnelChart} options={{ ...compactChartOptions, indexAxis: 'y' as const }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="admin-experiment-analytics">
      <div className="admin-experiment-analytics-head">
        <h3>Analytics Intelligence</h3>
        <p className="admin-muted">Success trends · budget outcomes · category distribution · validation funnel</p>
      </div>
      <div className="admin-experiment-analytics-grid">
        <div className="admin-experiment-chart-card admin-experiment-glass">
          <h4>Success Rate Trend</h4>
          <div className="admin-experiment-chart-wrap">
            <Line data={successChart} options={chartOptions} />
          </div>
        </div>
        <div className="admin-experiment-chart-card admin-experiment-glass">
          <h4>Budget vs Outcome</h4>
          <div className="admin-experiment-chart-wrap">
            <Bar data={budgetChart} options={chartOptions} />
          </div>
        </div>
        <div className="admin-experiment-chart-card admin-experiment-glass">
          <h4>Experiment Categories</h4>
          <div className="admin-experiment-chart-wrap admin-experiment-chart-wrap--doughnut">
            <Doughnut data={categoryChart} options={doughnutOptions} />
          </div>
        </div>
        <div className="admin-experiment-chart-card admin-experiment-glass">
          <h4>Validation Conversion Funnel</h4>
          <div className="admin-experiment-chart-wrap">
            <Bar data={funnelChart} options={{ ...chartOptions, indexAxis: 'y' as const }} />
          </div>
        </div>
      </div>
    </section>
  );
});
