// src/app/routes/Analytics.tsx
// PROFESSIONAL ANALYTICS DASHBOARD – Stats, charts, activity timeline

import { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { fetchOwnedTeamIds } from '../../lib/supabase/dbHelpers';
import { useAuthContext } from '../../contexts/AuthContext';
import { ContentLoader } from '../../components/common/ContentLoader';

const AnalyticsCharts = lazy(() => import('../../components/charts/AnalyticsCharts'));

// ============================================================
// TYPES
// ============================================================
interface DashboardStats {
  totalProjects: number;
  totalExperiments: number;
  totalPrototypes: number;
  totalTeamMembers: number;
  totalFundingPitches: number;
  totalAIAnalyses: number;
}

interface MonthlyActivity {
  month: string;
  projects: number;
  experiments: number;
}

// ============================================================
// ANALYTICS PAGE
// ============================================================
const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalExperiments: 0,
    totalPrototypes: 0,
    totalTeamMembers: 0,
    totalFundingPitches: 0,
    totalAIAnalyses: 0,
  });
  const [monthlyActivity, setMonthlyActivity] = useState<MonthlyActivity[]>([]);
  const { user, loading: authLoading } = useAuthContext();
  const userId = user?.id ?? null;
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const fetchAnalytics = useCallback(async () => {
    if (!userId) return;

    // Fetch counts from different tables
    const [
      { count: projectsCount },
      { count: experimentsCount },
      { count: prototypesCount },
      ownedTeamIds,
      { count: fundingPitchesCount },
      { count: aiAnalysesCount },
    ] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('experiments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('prototypes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      fetchOwnedTeamIds(userId),
      supabase.from('funding_pitches').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('ai_analyses').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    setStats({
      totalProjects: projectsCount || 0,
      totalExperiments: experimentsCount || 0,
      totalPrototypes: prototypesCount || 0,
      totalTeamMembers: ownedTeamIds.length,
      totalFundingPitches: fundingPitchesCount || 0,
      totalAIAnalyses: aiAnalysesCount || 0,
    });

    // Fetch monthly activity (last 6 months)
    const today = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM
    }

    // All 6 months fetched in parallel (was 12 sequential round-trips)
    const activityData: MonthlyActivity[] = await Promise.all(
      months.map(async (month) => {
        const startDate = `${month}-01`;
        const endDate = `${month}-31`;
        const [{ count: projCount }, { count: expCount }] = await Promise.all([
          supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', startDate)
            .lte('created_at', endDate),
          supabase
            .from('experiments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', startDate)
            .lte('created_at', endDate),
        ]);
        return {
          month: new Date(month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          projects: projCount || 0,
          experiments: expCount || 0,
        };
      })
    );
    setMonthlyActivity(activityData);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) fetchAnalytics();
  }, [userId, fetchAnalytics]);

  const barChartData = useMemo(() => ({
    labels: monthlyActivity.map(m => m.month),
    datasets: [
      {
        label: 'Projects',
        data: monthlyActivity.map(m => m.projects),
        backgroundColor: 'rgba(124, 95, 230, 0.6)',
        borderColor: '#7c5fe6',
        borderWidth: 1,
      },
      {
        label: 'Experiments',
        data: monthlyActivity.map(m => m.experiments),
        backgroundColor: 'rgba(47, 212, 255, 0.6)',
        borderColor: '#2fd4ff',
        borderWidth: 1,
      },
    ],
  }), [monthlyActivity]);

  const doughnutData = useMemo(() => ({
    labels: ['Projects', 'Experiments', 'Prototypes', 'Team Members', 'Funding Pitches'],
    datasets: [
      {
        data: [
          stats.totalProjects,
          stats.totalExperiments,
          stats.totalPrototypes,
          stats.totalTeamMembers,
          stats.totalFundingPitches,
        ],
        backgroundColor: [
          '#7c5fe6',
          '#2fd4ff',
          '#48bb78',
          '#f6c90e',
          '#fc8181',
        ],
        borderWidth: 0,
      },
    ],
  }), [stats]);

  if (loading || authLoading) {
    return (
      <div className="analytics-container">
        <main className="analytics-main"><div className="loading-spinner"></div></main>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <main className="analytics-main">
        <div className="analytics-header">
          <h1>📊 Analytics Dashboard</h1>
          <p>Track your innovation journey with real‑time metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-icon">📁</div><div className="stat-value">{stats.totalProjects}</div><div className="stat-label">Projects</div></div>
          <div className="stat-card"><div className="stat-icon">🧪</div><div className="stat-value">{stats.totalExperiments}</div><div className="stat-label">Experiments</div></div>
          <div className="stat-card"><div className="stat-icon">📦</div><div className="stat-value">{stats.totalPrototypes}</div><div className="stat-label">Prototypes</div></div>
          <div className="stat-card"><div className="stat-icon">👥</div><div className="stat-value">{stats.totalTeamMembers}</div><div className="stat-label">Team Members</div></div>
          <div className="stat-card"><div className="stat-icon">💰</div><div className="stat-value">{stats.totalFundingPitches}</div><div className="stat-label">Funding Pitches</div></div>
          <div className="stat-card"><div className="stat-icon">🤖</div><div className="stat-value">{stats.totalAIAnalyses}</div><div className="stat-label">AI Analyses</div></div>
        </div>

        {/* Charts deferred — Chart.js (~200KB) loads only when stats are ready */}
        <Suspense fallback={<ContentLoader />}>
          <AnalyticsCharts barChartData={barChartData} doughnutData={doughnutData} />
        </Suspense>

        {/* Recent Activity Timeline (simulated) */}
        <div className="timeline-card">
          <h3>Recent Activity</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-title">Latest project created</div>
                <div className="timeline-date">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-title">AI analysis completed</div>
                <div className="timeline-date">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .analytics-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        .analytics-main {
          flex: 1;
          margin-left: 0;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        @media (max-width: 768px) {
          .analytics-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        .analytics-header {
          margin-bottom: 2rem;
        }
        .analytics-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 900px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .stat-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .stat-icon { font-size: 2rem; }
        .stat-value { font-size: 1.5rem; font-weight: 700; }
        .stat-label { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
        .charts-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 900px) {
          .charts-row {
            grid-template-columns: 1fr;
          }
        }
        .chart-card, .timeline-card {
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 1rem;
        }
        .timeline {
          margin-top: 1rem;
        }
        .timeline-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .timeline-dot {
          width: 10px;
          height: 10px;
          background: #2fd4ff;
          border-radius: 50%;
          margin-top: 0.25rem;
        }
        .timeline-content {
          flex: 1;
        }
        .timeline-title {
          font-weight: 600;
        }
        .timeline-date {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
        .loading-spinner {
          width: 50px; height: 50px; border: 3px solid rgba(124,95,230,0.3); border-top-color: #7c5fe6;
          border-radius: 50%; animation: spin 1s linear infinite; margin: 20% auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Analytics;