import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { useAuth } from '../../../hooks/useAuth';
import { usePageLoad } from '../../../core/hooks/usePageLoad';
import { fetchMayaAlerts } from '../../maya/services/maya.service';
import { PageShell } from '../../shared/components/common/PageShell';

interface AIStats {
  chatSessions: number;
  analyses: number;
  documents: number;
  openAlerts: number;
}

interface RecentAnalysis {
  id: string;
  idea_name: string;
  created_at: string;
  result?: { score?: number };
}

const QUICK_LINKS = [
  { icon: '🤖', label: 'MAYA Assistant', desc: 'Chat with your innovation co-pilot', route: '/ai-assistant' },
  { icon: '🔍', label: 'AI Analyze', desc: 'Score ideas and get market insights', route: '/ai-analyze' },
  { icon: '📄', label: 'Document Center', desc: 'Upload and tag lifecycle documents', route: '/documents' },
  { icon: '🔐', label: 'Innovation Vault', desc: 'Secure IP and innovation assets', route: '/vault' },
  { icon: '🗄️', label: 'Enterprise Vault', desc: 'Partner-ready confidential knowledge', route: '/enterprise/vault' },
  { icon: '📈', label: 'Analytics', desc: 'Portfolio metrics and activity trends', route: '/analytics' },
] as const;

async function safeCount(
  table: string,
  filter: { column: string; value: string }
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(filter.column, filter.value);
  if (error) return 0;
  return count ?? 0;
}

export const AIDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AIStats>({
    chatSessions: 0,
    analyses: 0,
    documents: 0,
    openAlerts: 0,
  });
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [alerts, setAlerts] = useState<Awaited<ReturnType<typeof fetchMayaAlerts>>>([]);

  usePageLoad(async ({ cancelled }) => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [chatSessions, analyses, documents, openAlerts, alertRows] = await Promise.all([
        safeCount('ai_chat_sessions', { column: 'user_id', value: user.id }),
        safeCount('ai_analyses', { column: 'user_id', value: user.id }),
        safeCount('documents', { column: 'user_id', value: user.id }),
        safeCount('maya_alerts', { column: 'user_id', value: user.id }),
        fetchMayaAlerts(user.id, false),
      ]);

      const { data: analysisRows } = await supabase
        .from('ai_analyses')
        .select('id, idea_name, created_at, result')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (cancelled()) return;
      setStats({ chatSessions, analyses, documents, openAlerts });
      setRecentAnalyses((analysisRows ?? []) as RecentAnalysis[]);
      setAlerts(alertRows.slice(0, 5));
    } finally {
      if (!cancelled()) setLoading(false);
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <PageShell title="AI Dashboard" subtitle="Loading your AI workspace…">
        <div className="ai-dash-loading">Loading…</div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell title="AI Dashboard" subtitle="Sign in to view your AI workspace.">
        <p className="ai-dash-muted">Please sign in to continue.</p>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="AI Dashboard"
      subtitle="MAYA InnoOS — your AI command center across projects, documents, and insights"
      actions={
        <Link to="/ai-assistant" className="ai-dash-primary-btn">
          Open MAYA →
        </Link>
      }
    >
      <div className="ai-dash-stats">
        <div className="ai-dash-stat">
          <span className="ai-dash-stat__value">{stats.chatSessions}</span>
          <span className="ai-dash-stat__label">Chat sessions</span>
        </div>
        <div className="ai-dash-stat">
          <span className="ai-dash-stat__value">{stats.analyses}</span>
          <span className="ai-dash-stat__label">Idea analyses</span>
        </div>
        <div className="ai-dash-stat">
          <span className="ai-dash-stat__value">{stats.documents}</span>
          <span className="ai-dash-stat__label">Documents</span>
        </div>
        <div className="ai-dash-stat">
          <span className="ai-dash-stat__value">{stats.openAlerts}</span>
          <span className="ai-dash-stat__label">MAYA alerts</span>
        </div>
      </div>

      <section className="ai-dash-section">
        <h2>Quick actions</h2>
        <div className="ai-dash-grid">
          {QUICK_LINKS.map((item) => (
            <Link key={item.route} to={item.route} className="ai-dash-card">
              <span className="ai-dash-card__icon">{item.icon}</span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="ai-dash-columns">
        <section className="ai-dash-section">
          <h2>Recent analyses</h2>
          {recentAnalyses.length === 0 ? (
            <p className="ai-dash-muted">
              No analyses yet.{' '}
              <Link to="/ai-analyze">Run your first AI Analyze →</Link>
            </p>
          ) : (
            <ul className="ai-dash-list">
              {recentAnalyses.map((row) => (
                <li key={row.id}>
                  <div>
                    <strong>{row.idea_name}</strong>
                    <span className="ai-dash-muted">
                      {new Date(row.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {typeof row.result?.score === 'number' && (
                    <span className="ai-dash-score">{row.result.score}/100</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ai-dash-section">
          <h2>MAYA alerts</h2>
          {alerts.length === 0 ? (
            <p className="ai-dash-muted">No open alerts — MAYA will surface insights as you work.</p>
          ) : (
            <ul className="ai-dash-list">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <div>
                    <strong>{alert.title ?? 'Alert'}</strong>
                    <p className="ai-dash-muted">{alert.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <style>{`
        .ai-dash-loading { padding: 2rem; opacity: 0.7; }
        .ai-dash-primary-btn {
          display: inline-flex; align-items: center; padding: 0.6rem 1.1rem;
          background: #7c5fe6; color: #fff; border-radius: 10px; text-decoration: none;
          font-size: 0.9rem; font-weight: 600;
        }
        .ai-dash-primary-btn:hover { background: #6b4fd4; }
        .ai-dash-stats {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem; margin-bottom: 2rem;
        }
        .ai-dash-stat {
          background: rgba(124, 95, 230, 0.12); border: 1px solid rgba(124, 95, 230, 0.25);
          border-radius: 14px; padding: 1.25rem; text-align: center;
        }
        .ai-dash-stat__value { display: block; font-size: 1.75rem; font-weight: 700; color: #fff; }
        .ai-dash-stat__label { font-size: 0.8rem; opacity: 0.65; }
        .ai-dash-section { margin-bottom: 2rem; }
        .ai-dash-section h2 { font-size: 1.1rem; margin: 0 0 1rem; color: #fff; }
        .ai-dash-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem;
        }
        .ai-dash-card {
          display: flex; gap: 1rem; align-items: flex-start; padding: 1rem 1.1rem;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; text-decoration: none; color: inherit; transition: border-color 0.2s;
        }
        .ai-dash-card:hover { border-color: rgba(124, 95, 230, 0.5); }
        .ai-dash-card__icon { font-size: 1.5rem; }
        .ai-dash-card strong { display: block; color: #fff; margin-bottom: 0.25rem; }
        .ai-dash-card p { margin: 0; font-size: 0.8rem; opacity: 0.65; line-height: 1.4; }
        .ai-dash-columns {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;
        }
        .ai-dash-list { list-style: none; margin: 0; padding: 0; }
        .ai-dash-list li {
          display: flex; justify-content: space-between; align-items: center; gap: 1rem;
          padding: 0.85rem 0; border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .ai-dash-list li:last-child { border-bottom: none; }
        .ai-dash-list strong { display: block; color: #fff; font-size: 0.9rem; }
        .ai-dash-muted { font-size: 0.8rem; opacity: 0.6; margin: 0; }
        .ai-dash-muted a { color: #a78bfa; }
        .ai-dash-score {
          font-size: 0.85rem; font-weight: 700; color: #48bb78;
          background: rgba(72, 187, 120, 0.15); padding: 0.25rem 0.5rem; border-radius: 6px;
        }
      `}</style>
    </PageShell>
  );
};

export default AIDashboard;
