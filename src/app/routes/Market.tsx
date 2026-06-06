// C:\Users\user\maylet-xlab\src\app\routes\Market.tsx
// PROFESSIONAL MARKET INSIGHTS – Market size, trends, competitor analysis, pricing benchmarks

import { useState, useEffect } from 'react'; // Removed useRef
import { Link } from 'react-router-dom'; // Removed useNavigate (not used)
import { supabase } from '../../lib/supabase/client';

// Chart.js imports
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
// SIDEBAR (consistent with other pages)
// ============================================================
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate(); // Still needed for logout

  const mainMenu = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '📁', label: 'Projects', route: '/projects' },
    { icon: '🧪', label: 'Experiments', route: '/experiments' },
    { icon: '🤖', label: 'AI Assistant', route: '/ai-assistant' },
    { icon: '📦', label: 'Prototypes', route: '/prototypes' },
    { icon: '👥', label: 'Teams', route: '/teams' },
    { icon: '📄', label: 'Documents', route: '/documents' },
    { icon: '🔐', label: 'Innovation Vault', route: '/vault' },
    { icon: '💰', label: 'Funding Hub', route: '/funding' },
    { icon: '🎓', label: 'Mentorship', route: '/mentorship' },
    { icon: '🏢', label: 'Enterprise', route: '/enterprise' },
    { icon: '🏆', label: 'Hackathons', route: '/hackathons' },
    { icon: '📚', label: 'Learning Hub', route: '/learning' },
    { icon: '📈', label: 'Market', route: '/market', active: true },
    { icon: '🛒', label: 'Marketplace', route: '/marketplace' },
    { icon: '💬', label: 'Feedback', route: '/feedback' },
    { icon: '🛠️', label: 'Help & Support', route: '/help' },
  ];

  const userMenu = [
    { icon: '🔔', label: 'Notifications', route: '/notifications' },
    { icon: '⚙️', label: 'Settings', route: '/settings' },
    { icon: '👤', label: 'Profile', route: '/profile' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <button className="mobile-sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">✦</div>
          {!collapsed && (
            <div className="logo-text">
              <div className="logo-title">MAYLET X LAB</div>
              <div className="logo-tagline">Innovate. Build. Scale.</div>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {mainMenu.map((item) => (
            <Link key={item.label} to={item.route} className={`sidebar-link ${item.active ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-divider"></div>
        <nav className="sidebar-nav user-nav">
          {userMenu.map((item) => (
            <Link key={item.label} to={item.route} className="sidebar-link" title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
          <button onClick={handleLogout} className="sidebar-link logout-link">
            <span className="sidebar-icon">🚪</span>
            {!collapsed && <span className="sidebar-label">Sign Out</span>}
          </button>
        </nav>
      </aside>
      <style>{`
        .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 98; display: none; }
        .mobile-sidebar-toggle { display: none; position: fixed; top: 1rem; left: 1rem; z-index: 100; background: #7c5fe6; border: none; color: white; font-size: 1.5rem; width: 48px; height: 48px; border-radius: 12px; cursor: pointer; }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; background: #0a0d1a; color: rgba(255,255,255,0.7); display: flex; flex-direction: column; z-index: 99; transition: width 0.3s ease; overflow-y: auto; overflow-x: hidden; width: 280px; box-shadow: 2px 0 10px rgba(0,0,0,0.3); }
        .sidebar.collapsed { width: 80px; }
        .sidebar-logo { padding: 1.5rem 1rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; }
        .logo-icon { font-size: 2rem; font-weight: bold; background: linear-gradient(135deg, #7c5fe6, #2fd4ff); -webkit-background-clip: text; background-clip: text; color: transparent; min-width: 40px; text-align: center; }
        .logo-title { font-weight: 700; font-size: 1rem; color: white; }
        .logo-tagline { font-size: 0.65rem; color: rgba(255,255,255,0.5); }
        .sidebar-toggle { position: absolute; right: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; }
        .sidebar-nav { flex: 1; padding: 1rem 0; }
        .sidebar-link { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; margin: 0.25rem 0.5rem; border-radius: 12px; background: none; border: none; width: calc(100% - 1rem); cursor: pointer; font-size: 0.9rem; }
        .sidebar-link:hover { background: rgba(124,95,230,0.2); color: white; }
        .sidebar-link.active { background: #7c5fe6; color: white; }
        .sidebar-icon { font-size: 1.25rem; min-width: 24px; text-align: center; }
        .sidebar-label { font-size: 0.85rem; white-space: nowrap; }
        .sidebar.collapsed .sidebar-label { display: none; }
        .sidebar.collapsed .sidebar-link { justify-content: center; padding: 0.75rem; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0.5rem 1rem; }
        .user-nav { margin-bottom: 1rem; }
        .logout-link { color: #fc8181; }
        .logout-link:hover { background: rgba(252,129,129,0.2); color: #fc8181; }
        @media (max-width: 768px) { .mobile-sidebar-toggle { display: block; } .sidebar { transform: translateX(-100%); width: 280px; } .sidebar.mobile-open { transform: translateX(0); } .sidebar-overlay { display: block; } }
      `}</style>
    </>
  );
};

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

  const barChartData = {
    labels: marketData.map(d => d.region),
    datasets: [{
      label: 'Market Size (USD Million)',
      data: marketData.map(d => d.market_size),
      backgroundColor: 'rgba(124, 95, 230, 0.6)',
      borderColor: '#7c5fe6',
      borderWidth: 1,
    }],
  };

  const lineChartData = {
    labels: marketData.map(d => d.region),
    datasets: [{
      label: 'Growth Rate (%)',
      data: marketData.map(d => d.growth_rate),
      borderColor: '#2fd4ff',
      backgroundColor: 'rgba(47, 212, 255, 0.1)',
      fill: true,
      tension: 0.3,
    }],
  };

  const topCompetitors = [...competitors].sort((a, b) => b.market_share - a.market_share);
  const competitorTotal = topCompetitors.reduce((sum, c) => sum + c.market_share, 0);

  if (loading) {
    return (
      <div className="market-container">
        <Sidebar />
        <main className="market-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="market-container">
      <Sidebar />
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

        <div className="charts-row">
          <div className="chart-card">
            <h3>Market Size by Region</h3>
            <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </div>
          <div className="chart-card">
            <h3>Growth Rate by Region</h3>
            <Line data={lineChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
          </div>
        </div>

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
        .market-main { flex: 1; margin-left: 280px; padding: 2rem; transition: margin-left 0.3s ease; }
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