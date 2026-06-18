// C:\Users\user\maylet-xlab\src\app\routes\admin\reports\AdminReports.tsx
// FULL ADMIN REPORTS PAGE - GENERATE AND EXPORT REPORTS
// WITH PDF, CSV, EXCEL EXPORT AND ANALYTICS DASHBOARD

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase/client';
import { fetchAdminReportData, type AdminReportData } from '../../services/adminReports.service';

// ============================================================
// REPORT CARD COMPONENT
// ============================================================
const ReportCard = ({ title, value, icon, color, onClick }: { title: string; value: string | number; icon: string; color: string; onClick?: () => void }) => (
  <div className="report-card" style={{ borderLeft: `4px solid ${color}` }} onClick={onClick}>
    <div className="report-card-icon" style={{ background: `${color}20` }}>{icon}</div>
    <div className="report-card-content">
      <div className="report-card-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="report-card-title">{title}</div>
    </div>
  </div>
);

// ============================================================
// MAIN ADMIN REPORTS COMPONENT
// ============================================================
const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState<AdminReportData>({
    totalUsers: 0,
    totalProjects: 0,
    totalExperiments: 0,
    totalPrototypes: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    newUsersThisMonth: 0,
    newProjectsThisMonth: 0,
    activeUsers: 0,
    projectsByStatus: { idea: 0, experiment: 0, prototype: 0, launched: 0 },
    projectsBySector: {},
    revenueByMonth: [],
  });
  const [selectedReportType, setSelectedReportType] = useState('full');
  const [dateRange, setDateRange] = useState('month');
  const [adminName, setAdminName] = useState('Admin');
  const navigate = useNavigate();

  // Fetch report data
  const fetchReportData = async () => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', session.user.id)
        .single();
      
      setAdminName(profile?.full_name || session.user.email?.split('@')[0] || 'Admin');

      const data = await fetchAdminReportData();
      setReportData(data);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export report as CSV
  const exportAsCSV = () => {
    setExporting(true);
    
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Users', reportData.totalUsers],
      ['Total Projects', reportData.totalProjects],
      ['Total Experiments', reportData.totalExperiments],
      ['Total Prototypes', reportData.totalPrototypes],
      ['Total Revenue', `$${reportData.totalRevenue.toLocaleString()}`],
      ['Monthly Revenue', `$${reportData.monthlyRevenue.toLocaleString()}`],
      ['New Users (This Month)', reportData.newUsersThisMonth],
      ['New Projects (This Month)', reportData.newProjectsThisMonth],
      ['Active Users (Last 7 Days)', reportData.activeUsers],
      ['Projects by Status - Idea', reportData.projectsByStatus.idea],
      ['Projects by Status - Experiment', reportData.projectsByStatus.experiment],
      ['Projects by Status - Prototype', reportData.projectsByStatus.prototype],
      ['Projects by Status - Launched', reportData.projectsByStatus.launched],
    ];

    // Add sector data
    Object.entries(reportData.projectsBySector).forEach(([sector, count]) => {
      rows.push([`Projects by Sector - ${sector}`, count]);
    });

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maylet-xlab-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setExporting(false);
  };

  // Export as JSON
  const exportAsJSON = () => {
    setExporting(true);
    
    const exportData = {
      generatedAt: new Date().toISOString(),
      generatedBy: adminName,
      reportType: selectedReportType,
      dateRange,
      data: reportData,
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maylet-xlab-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    setExporting(false);
  };

  // Print report
  const printReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Maylet XLab Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #7c5fe6; }
          h2 { margin-top: 20px; color: #2fd4ff; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>MAYLET X LAB - Platform Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Generated by: ${adminName}</p>
        
        <h2>Summary Statistics</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Users</td><td>${reportData.totalUsers.toLocaleString()}</td></tr>
          <tr><td>Total Projects</td><td>${reportData.totalProjects.toLocaleString()}</td></tr>
          <tr><td>Total Experiments</td><td>${reportData.totalExperiments.toLocaleString()}</td></tr>
          <tr><td>Total Prototypes</td><td>${reportData.totalPrototypes.toLocaleString()}</td></tr>
          <tr><td>Total Revenue</td><td>$${reportData.totalRevenue.toLocaleString()}</td></tr>
          <tr><td>Monthly Revenue</td><td>$${reportData.monthlyRevenue.toLocaleString()}</td></tr>
        </table>
        
        <h2>Growth Metrics</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>New Users (This Month)</td><td>${reportData.newUsersThisMonth}</td></tr>
          <tr><td>New Projects (This Month)</td><td>${reportData.newProjectsThisMonth}</td></tr>
          <tr><td>Active Users (Last 7 Days)</td><td>${reportData.activeUsers}</td></tr>
        </table>
        
        <h2>Projects by Status</h2>
        <table>
          <tr><th>Status</th><th>Count</th></tr>
          <tr><td>Idea</td><td>${reportData.projectsByStatus.idea}</td></tr>
          <tr><td>Experiment</td><td>${reportData.projectsByStatus.experiment}</td></tr>
          <tr><td>Prototype</td><td>${reportData.projectsByStatus.prototype}</td></tr>
          <tr><td>Launched</td><td>${reportData.projectsByStatus.launched}</td></tr>
        </table>
        
        <div class="footer">
          <p>© 2025 Maylet XLab. All rights reserved.</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="admin-reports-container">
        <main className="admin-reports-main">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading report data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-reports-container">
      
      <main className="admin-reports-main">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>Reports & Analytics</h1>
            <p className="subtitle">Generate and export platform reports</p>
          </div>
          <div className="header-right">
            <button onClick={() => fetchReportData()} className="btn-refresh">
              ⟳ Refresh
            </button>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="report-type-selector">
          <div className="selector-label">Report Type:</div>
          <div className="selector-options">
            <button 
              className={`selector-option ${selectedReportType === 'full' ? 'active' : ''}`}
              onClick={() => setSelectedReportType('full')}
            >
              📊 Full Report
            </button>
            <button 
              className={`selector-option ${selectedReportType === 'users' ? 'active' : ''}`}
              onClick={() => setSelectedReportType('users')}
            >
              👥 Users Report
            </button>
            <button 
              className={`selector-option ${selectedReportType === 'projects' ? 'active' : ''}`}
              onClick={() => setSelectedReportType('projects')}
            >
              📁 Projects Report
            </button>
            <button 
              className={`selector-option ${selectedReportType === 'financial' ? 'active' : ''}`}
              onClick={() => setSelectedReportType('financial')}
            >
              💰 Financial Report
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="date-range-selector">
          <div className="selector-label">Date Range:</div>
          <div className="selector-options">
            <button 
              className={`selector-option ${dateRange === 'week' ? 'active' : ''}`}
              onClick={() => setDateRange('week')}
            >
              Last 7 Days
            </button>
            <button 
              className={`selector-option ${dateRange === 'month' ? 'active' : ''}`}
              onClick={() => setDateRange('month')}
            >
              This Month
            </button>
            <button 
              className={`selector-option ${dateRange === 'quarter' ? 'active' : ''}`}
              onClick={() => setDateRange('quarter')}
            >
              Last 3 Months
            </button>
            <button 
              className={`selector-option ${dateRange === 'year' ? 'active' : ''}`}
              onClick={() => setDateRange('year')}
            >
              This Year
            </button>
            <button 
              className={`selector-option ${dateRange === 'all' ? 'active' : ''}`}
              onClick={() => setDateRange('all')}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <ReportCard title="Total Users" value={reportData.totalUsers} icon="👥" color="#7c5fe6" />
          <ReportCard title="Total Projects" value={reportData.totalProjects} icon="📁" color="#2fd4ff" />
          <ReportCard title="Total Revenue" value={`$${reportData.totalRevenue.toLocaleString()}`} icon="💰" color="#48bb78" />
          <ReportCard title="Active Users" value={reportData.activeUsers} icon="🟢" color="#f6c90e" />
        </div>

        {/* Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-block">
            <div className="stat-block-icon">📈</div>
            <div className="stat-block-content">
              <div className="stat-block-value">{reportData.newUsersThisMonth}</div>
              <div className="stat-block-label">New Users This Month</div>
            </div>
          </div>
          <div className="stat-block">
            <div className="stat-block-icon">🚀</div>
            <div className="stat-block-content">
              <div className="stat-block-value">{reportData.newProjectsThisMonth}</div>
              <div className="stat-block-label">New Projects This Month</div>
            </div>
          </div>
          <div className="stat-block">
            <div className="stat-block-icon">🧪</div>
            <div className="stat-block-content">
              <div className="stat-block-value">{reportData.totalExperiments}</div>
              <div className="stat-block-label">Total Experiments</div>
            </div>
          </div>
          <div className="stat-block">
            <div className="stat-block-icon">📦</div>
            <div className="stat-block-content">
              <div className="stat-block-value">{reportData.totalPrototypes}</div>
              <div className="stat-block-label">Total Prototypes</div>
            </div>
          </div>
        </div>

        {/* Projects by Status Chart */}
        <div className="chart-card">
          <h3>📊 Projects by Status</h3>
          <div className="status-chart">
            <div className="status-bar">
              <div className="status-label">Idea</div>
              <div className="status-bar-container">
                <div className="status-bar-fill idea" style={{ width: `${(reportData.projectsByStatus.idea / reportData.totalProjects) * 100}%` }}></div>
              </div>
              <div className="status-count">{reportData.projectsByStatus.idea}</div>
            </div>
            <div className="status-bar">
              <div className="status-label">Experiment</div>
              <div className="status-bar-container">
                <div className="status-bar-fill experiment" style={{ width: `${(reportData.projectsByStatus.experiment / reportData.totalProjects) * 100}%` }}></div>
              </div>
              <div className="status-count">{reportData.projectsByStatus.experiment}</div>
            </div>
            <div className="status-bar">
              <div className="status-label">Prototype</div>
              <div className="status-bar-container">
                <div className="status-bar-fill prototype" style={{ width: `${(reportData.projectsByStatus.prototype / reportData.totalProjects) * 100}%` }}></div>
              </div>
              <div className="status-count">{reportData.projectsByStatus.prototype}</div>
            </div>
            <div className="status-bar">
              <div className="status-label">Launched</div>
              <div className="status-bar-container">
                <div className="status-bar-fill launched" style={{ width: `${(reportData.projectsByStatus.launched / reportData.totalProjects) * 100}%` }}></div>
              </div>
              <div className="status-count">{reportData.projectsByStatus.launched}</div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="chart-card">
          <h3>💰 Revenue by Month (Last 6 Months)</h3>
          <div className="revenue-chart">
            {reportData.revenueByMonth.map((item, index) => (
              <div key={index} className="revenue-bar-container">
                <div className="revenue-bar" style={{ height: `${(item.amount / Math.max(...reportData.revenueByMonth.map(r => r.amount), 1)) * 100}%` }}></div>
                <div className="revenue-label">{item.month}</div>
                <div className="revenue-value">${(item.amount / 1000).toFixed(1)}K</div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects by Sector */}
        <div className="chart-card">
          <h3>📁 Projects by Sector</h3>
          <div className="sector-grid">
            {Object.entries(reportData.projectsBySector).map(([sector, count], index) => (
              <div key={index} className="sector-item">
                <div className="sector-name">{sector}</div>
                <div className="sector-bar-container">
                  <div className="sector-bar" style={{ width: `${(count / reportData.totalProjects) * 100}%` }}></div>
                </div>
                <div className="sector-count">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="export-section">
          <h3>📎 Export Report</h3>
          <div className="export-buttons">
            <button onClick={exportAsCSV} disabled={exporting} className="export-btn csv">
              📊 Export as CSV
            </button>
            <button onClick={exportAsJSON} disabled={exporting} className="export-btn json">
              📋 Export as JSON
            </button>
            <button onClick={printReport} disabled={exporting} className="export-btn print">
              🖨️ Print Report
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="admin-footer">
          <div className="footer-left">
            <span>© 2025 Maylet XLab. All rights reserved.</span>
          </div>
          <div className="footer-center">
            <span className="system-status online">
              <span className="status-dot"></span> System Online
            </span>
          </div>
          <div className="footer-right">
            <span className="version">v2.0.0 | Reports Module</span>
          </div>
        </footer>
      </main>

      <style>{`
        .admin-reports-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .admin-reports-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .admin-reports-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 70vh;
          gap: 1rem;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(124,95,230,0.3);
          border-top-color: #7c5fe6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .page-header h1 {
          font-size: 2rem;
          background: linear-gradient(135deg, #ffffff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.25rem;
        }
        
        .subtitle {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
        }
        
        .btn-refresh {
          padding: 0.5rem 1.2rem;
          background: rgba(124,95,230,0.2);
          border: 1px solid rgba(124,95,230,0.3);
          border-radius: 30px;
          color: #9b7ff0;
          cursor: pointer;
        }
        
        .report-type-selector, .date-range-selector {
          background: rgba(0,0,0,0.3);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        
        .selector-label {
          font-size: 0.85rem;
          color: rgba(255,255,255,0.7);
          font-weight: 500;
        }
        
        .selector-options {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .selector-option {
          padding: 0.4rem 1rem;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 30px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .selector-option.active {
          background: #7c5fe6;
          color: white;
          border-color: #7c5fe6;
        }
        
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        @media (max-width: 1000px) {
          .summary-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 500px) {
          .summary-cards {
            grid-template-columns: 1fr;
          }
        }
        
        .report-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .report-card:hover {
          transform: translateY(-2px);
          background: rgba(0,0,0,0.5);
        }
        
        .report-card-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        
        .report-card-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: white;
        }
        
        .report-card-title {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        @media (max-width: 1000px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .stat-block {
          background: rgba(0,0,0,0.3);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .stat-block-icon {
          font-size: 1.8rem;
        }
        
        .stat-block-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #2fd4ff;
        }
        
        .stat-block-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .chart-card {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        
        .chart-card h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .status-chart {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .status-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .status-label {
          width: 90px;
          font-size: 0.8rem;
        }
        
        .status-bar-container {
          flex: 1;
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .status-bar-fill {
          height: 100%;
          border-radius: 4px;
        }
        
        .status-bar-fill.idea { background: #f6c90e; }
        .status-bar-fill.experiment { background: #2fd4ff; }
        .status-bar-fill.prototype { background: #7c5fe6; }
        .status-bar-fill.launched { background: #48bb78; }
        
        .status-count {
          width: 40px;
          font-size: 0.75rem;
          text-align: right;
        }
        
        .revenue-chart {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 200px;
          gap: 1rem;
        }
        
        .revenue-bar-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .revenue-bar {
          width: 100%;
          max-width: 60px;
          background: linear-gradient(180deg, #7c5fe6, #2fd4ff);
          border-radius: 4px 4px 0 0;
          transition: height 0.3s;
          min-height: 4px;
        }
        
        .revenue-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .revenue-value {
          font-size: 0.65rem;
          color: #48bb78;
        }
        
        .sector-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 0.75rem;
        }
        
        .sector-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .sector-name {
          width: 100px;
          font-size: 0.75rem;
        }
        
        .sector-bar-container {
          flex: 1;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .sector-bar {
          height: 100%;
          background: linear-gradient(90deg, #7c5fe6, #2fd4ff);
          border-radius: 3px;
        }
        
        .sector-count {
          width: 40px;
          font-size: 0.7rem;
          text-align: right;
          color: #9b7ff0;
        }
        
        .export-section {
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        
        .export-section h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        
        .export-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .export-btn {
          padding: 0.6rem 1.5rem;
          border: none;
          border-radius: 30px;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .export-btn.csv {
          background: rgba(72,187,120,0.2);
          color: #48bb78;
          border: 1px solid rgba(72,187,120,0.3);
        }
        
        .export-btn.json {
          background: rgba(124,95,230,0.2);
          color: #9b7ff0;
          border: 1px solid rgba(124,95,230,0.3);
        }
        
        .export-btn.print {
          background: rgba(246,201,14,0.2);
          color: #f6c90e;
          border: 1px solid rgba(246,201,14,0.3);
        }
        
        .export-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }
        
        .export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .admin-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1.5rem;
          margin-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .system-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: #48bb78;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        .version {
          background: rgba(255,255,255,0.05);
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default AdminReports;