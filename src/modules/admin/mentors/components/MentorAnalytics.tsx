import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { memo, useMemo } from 'react';
import type { MentorAnalyticsData } from '../types/mentorOps.types';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

interface MentorAnalyticsProps {
  data: MentorAnalyticsData;
}

export const MentorAnalytics = memo(function MentorAnalytics({ data }: MentorAnalyticsProps) {
  const sessionsChart = useMemo(
    () => ({
      labels: data.sessionsPerMonth.map((d) => d.month),
      datasets: [
        {
          label: 'Sessions',
          data: data.sessionsPerMonth.map((d) => d.count),
          backgroundColor: 'rgba(124, 95, 230, 0.6)',
          borderColor: '#7c5fe6',
          borderWidth: 1,
        },
      ],
    }),
    [data.sessionsPerMonth]
  );

  const activityChart = useMemo(
    () => ({
      labels: data.activityTrend.map((d) => d.month),
      datasets: [
        {
          label: 'Sessions',
          data: data.activityTrend.map((d) => d.sessions),
          borderColor: '#2fd4ff',
          backgroundColor: 'rgba(47, 212, 255, 0.15)',
          tension: 0.3,
        },
        {
          label: 'Assignments',
          data: data.activityTrend.map((d) => d.assignments),
          borderColor: '#48bb78',
          backgroundColor: 'rgba(72, 187, 120, 0.15)',
          tension: 0.3,
        },
      ],
    }),
    [data.activityTrend]
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: {
      x: { ticks: { color: '#a0aec0' }, grid: { color: 'rgba(255,255,255,0.06)' } },
      y: { ticks: { color: '#a0aec0' }, grid: { color: 'rgba(255,255,255,0.06)' } },
    },
  };

  return (
    <section className="admin-mentor-analytics">
      <div className="admin-mentor-analytics-head">
        <h3>Performance Analytics</h3>
        <span className="admin-mentor-utilization">
          Utilization <strong>{data.utilizationRate}%</strong>
        </span>
      </div>
      <div className="admin-mentor-analytics-grid">
        <div className="admin-mentor-chart-card">
          <h4>Sessions per Month</h4>
          <div className="admin-mentor-chart-wrap">
            <Bar data={sessionsChart} options={chartOptions} />
          </div>
        </div>
        <div className="admin-mentor-chart-card">
          <h4>Mentor Activity Trend</h4>
          <div className="admin-mentor-chart-wrap">
            <Line data={activityChart} options={chartOptions} />
          </div>
        </div>
        <div className="admin-mentor-chart-card admin-mentor-top-list">
          <h4>Top Performing Mentors</h4>
          <ul>
            {data.topMentors.map((m, i) => (
              <li key={m.name}>
                <span>{i + 1}. {m.name}</span>
                <span>{m.sessions} sessions · ⭐ {m.rating.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="admin-mentor-chart-card admin-mentor-top-list">
          <h4>Expertise Coverage</h4>
          <ul>
            {data.expertiseCoverage.map((e) => (
              <li key={e.expertise}>
                <span>{e.expertise}</span>
                <span>{e.count} mentors</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
});
