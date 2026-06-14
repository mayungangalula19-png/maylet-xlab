import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { ChartData } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Props {
  barChartData: ChartData<'bar'>;
  doughnutData: ChartData<'doughnut'>;
}

/** Heavy Chart.js bundle — loaded only when analytics charts render. */
export default function AnalyticsCharts({ barChartData, doughnutData }: Props) {
  return (
    <div className="charts-row">
      <div className="chart-card">
        <h3>Monthly Activity (Last 6 months)</h3>
        <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
      </div>
      <div className="chart-card">
        <h3>Overall Distribution</h3>
        <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
      </div>
    </div>
  );
}
