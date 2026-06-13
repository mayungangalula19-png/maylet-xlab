import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { ChartData } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  barData: ChartData<'bar'>;
  lineData: ChartData<'line'>;
}

/** Heavy Chart.js bundle — loaded only when market charts render. */
export default function MarketCharts({ barData, lineData }: Props) {
  return (
    <div className="charts-row">
      <div className="chart-card">
        <h3>Market Size by Region</h3>
        <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
      </div>
      <div className="chart-card">
        <h3>Growth Rate by Region</h3>
        <Line data={lineData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
      </div>
    </div>
  );
}
