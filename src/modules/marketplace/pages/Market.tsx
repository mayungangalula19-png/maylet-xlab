// C:\Users\user\maylet-xlab\src\app\routes\Market.tsx
// PROFESSIONAL MARKET INSIGHTS – Market size, trends, competitor analysis, pricing benchmarks

import { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { ContentLoader } from '../../../modules/shared/components/common/ContentLoader';

const MarketCharts = lazy(() => import('../../../components/charts/MarketCharts'));

// ============================================================
// TYPES
// ============================================================
interface MarketData {
  id: string;
  region: string;
  market_size: number;
  growth_rate: number;
  year: number;
}

interface Competitor {
  id: string;
  name: string;
  market_share: number;
  strength: string;
  weakness: string;
}

interface PricingBenchmark {
  product_type: string;
  average_price: number;
  price_range_low: number;
  price_range_high: number;
}

// ============================================================
// MARKET INSIGHTS PAGE
// ============================================================
const Market = () => {
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [pricingBenchmarks, setPricingBenchmarks] = useState<PricingBenchmark[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('East Africa');

  // Sample data (in production, fetch from Supabase)
  useEffect(() => {
    const fetchData = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setMarketData([
        { id: '1', region: 'East Africa', market_size: 42.5, growth_rate: 12.3, year: 2024 },
        { id: '2', region: 'West Africa', market_size: 38.2, growth_rate: 10.8, year: 2024 },
        { id: '3', region: 'Southern Africa', market_size: 35.1, growth_rate: 9.5, year: 2024 },
        { id: '4', region: 'North Africa', market_size: 28.7, growth_rate: 8.2, year: 2024 },
        { id: '5', region: 'Central Africa', market_size: 12.4, growth_rate: 11.1, year: 2024 },
      ]);
      setCompetitors([
        { id: 'c1', name: 'InnovateHub', market_share: 28, strength: 'Strong community', weakness: 'Limited funding tools' },
        { id: 'c2', name: 'AfriLabs', market_share: 22, strength: 'Pan-African network', weakness: 'Slow feature rollout' },
        { id: 'c3', name: 'EcoInnovate', market_share: 15, strength: 'Focus on sustainability', weakness: 'Small user base' },
        { id: 'c4', name: 'Maylet XLab', market_share: 12, strength: 'AI-powered innovation OS', weakness: 'New entrant' },
        { id: 'c5', name: 'Other', market_share: 23, strength: 'Various', weakness: 'Fragmented' },
      ]);
      setPricingBenchmarks([
        { product_type: 'Basic Plan', average_price: 15, price_range_low: 9, price_range_high: 29 },
        { product_type: 'Pro Plan', average_price: 45, price_range_low: 29, price_range_high: 79 },
        { product_type: 'Enterprise', average_price: 199, price_range_low: 99, price_range_high: 399 },
        { product_type: 'AI Add-on', average_price: 20, price_range_low: 10, price_range_high: 35 },
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const barChartData = useMemo(() => ({
    labels: marketData.map(d => d.region),
    datasets: [{
      label: 'Market Size (USD Million)',
      data: marketData.map(d => d.market_size),
      backgroundColor: 'rgba(124, 95, 230, 0.6)',
      borderColor: '#7c5fe6',
      borderWidth: 1,
    }],
  }), [marketData]);

  const lineChartData = useMemo(() => ({
    labels: marketData.map(d => d.region),
    datasets: [{
      label: 'Growth Rate (%)',
      data: marketData.map(d => d.growth_rate),
      borderColor: '#2fd4ff',
      backgroundColor: 'rgba(47, 212, 255, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  }), [marketData]);

  const topCompetitors = useMemo(
    () => [...competitors].sort((a, b) => b.market_share - a.market_share),
    [competitors]
  );
  const competitorTotal = topCompetitors.reduce((sum, c) => sum + c.market_share, 0);

  if (loading) {
    return (
      <div className="market-container">
        <main className="market-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="market-container">
      <main className="market-main">
        <div className="market-header">
          <h1>📊 Market Insights</h1>
          <p>Data‑driven analysis to help you make strategic decisions</p>
        </div>

        <div className="region-selector">
          <label>🌍 Region: </label>
          <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
            <option value="East Africa">East Africa</option>
            <option value="West Africa">West Africa</option>
            <option value="Southern Africa">Southern Africa</option>
            <option value="North Africa">North Africa</option>
            <option value="Central Africa">Central Africa</option>
          </select>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-value">{marketData.find(d => d.region === selectedRegion)?.market_size.toFixed(1) || '—'}</div>
            <div className="stat-label">Market Size ($M)</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-value">{marketData.find(d => d.region === selectedRegion)?.growth_rate.toFixed(1) || '—'}%</div>
            <div className="stat-label">Growth Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-value">{topCompetitors[0]?.market_share || 0}%</div>
            <div className="stat-label">Top Competitor Share</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value">${pricingBenchmarks[0]?.average_price || 0}</div>
            <div className="stat-label">Avg. Basic Plan</div>
          </div>
        </div>

        <Suspense fallback={<ContentLoader />}>
          <MarketCharts barData={barChartData} lineData={lineChartData} />
        </Suspense>

        <div className="two-columns">
          <div className="competitor-card">
            <h3>🏅 Competitor Market Share</h3>
            <div className="competitor-list">
              {topCompetitors.map(comp => (
                <div key={comp.id} className="competitor-item">
                  <div className="competitor-name">{comp.name}</div>
                  <div className="competitor-share">
                    <div className="share-bar" style={{ width: `${(comp.market_share / competitorTotal) * 100}%`, background: comp.name === 'Maylet XLab' ? '#2fd4ff' : '#7c5fe6' }}></div>
                    <span>{comp.market_share}%</span>
                  </div>
                  <div className="competitor-strength">✓ {comp.strength}</div>
                  <div className="competitor-weakness">✗ {comp.weakness}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pricing-card">
            <h3>💰 Pricing Benchmarks</h3>
            <table className="pricing-table">
              <thead><tr><th>Product Type</th><th>Avg Price</th><th>Price Range</th></tr></thead>
              <tbody>
                {pricingBenchmarks.map(item => (
                  <tr key={item.product_type}>
                    <td>{item.product_type}</td>
                    <td>${item.average_price}</td>
                    <td>${item.price_range_low} – ${item.price_range_high}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="pricing-note">*Data based on regional SaaS and innovation platforms.</p>
          </div>
        </div>

        <div className="recommendations-card">
          <h3>💡 Strategic Recommendations</h3>
          <ul>
            <li><strong>East Africa</strong> shows the highest growth potential. Focus marketing and pilot programs there.</li>
            <li><strong>Pricing:</strong> Your Pro plan ($15) is below average ($45). Consider tiered pricing with more features for enterprises.</li>
            <li><strong>Competitor gap:</strong> InnovateHub leads with community. Build a strong mentorship network to differentiate.</li>
            <li><strong>Opportunity:</strong> AI‑powered innovation OS is still a blue ocean – emphasize your unique AI capabilities (MAYA).</li>
          </ul>
        </div>
      </main>

      <style>{`
        .market-container { display: flex; min-height: 100vh; background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%); }
        .market-main { flex: 1; margin-left: 0; padding: 2rem; transition: margin-left 0.3s ease; }
        @media (max-width: 768px) { .market-main { margin-left: 0; padding: 1rem; padding-top: 5rem; } }
        .market-header { margin-bottom: 2rem; }
        .market-header h1 { font-size: 1.8rem; background: linear-gradient(135deg, #fff, #9b7ff0); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .region-selector { background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 20px; padding: 1rem; margin-bottom: 2rem; display: inline-block; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
        @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        .stat-card { background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 20px; padding: 1rem; display: flex; align-items: center; gap: 1rem; }
        .stat-icon { font-size: 2rem; }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
        .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        @media (max-width: 900px) { .charts-row { grid-template-columns: 1fr; } }
        .chart-card { background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 20px; padding: 1rem; }
        .two-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
        @media (max-width: 900px) { .two-columns { grid-template-columns: 1fr; } }
        .competitor-card, .pricing-card, .recommendations-card { background: rgba(0,0,0,0.4); backdrop-filter: blur(10px); border-radius: 20px; padding: 1.5rem; }
        .competitor-item { margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
        .competitor-name { font-weight: bold; }
        .competitor-share { display: flex; align-items: center; gap: 0.5rem; margin: 0.25rem 0; }
        .share-bar { height: 8px; border-radius: 4px; transition: width 0.3s; }
        .competitor-strength, .competitor-weakness { font-size: 0.7rem; color: rgba(255,255,255,0.7); }
        .pricing-table { width: 100%; border-collapse: collapse; }
        .pricing-table th, .pricing-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .pricing-table th { color: #7c5fe6; }
        .pricing-note { font-size: 0.7rem; margin-top: 0.5rem; color: rgba(255,255,255,0.5); }
        .recommendations-card ul { padding-left: 1.2rem; }
        .recommendations-card li { margin-bottom: 0.5rem; }
        .loading-spinner { width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6; border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Market;