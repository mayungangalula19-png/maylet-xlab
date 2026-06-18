import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminSectionPage } from '../../components/layout/AdminSectionPage';
import { AdminLoadingState } from '../../components/layout/AdminLoadingState';
import { AdminAnalyticsView } from '../../components/analytics/AdminAnalyticsView';
import { fetchAdminAnalyticsSnapshot } from '../../services/adminAnalytics.service';
import type { AdminAnalyticsSnapshot } from '../../types/adminAnalytics.types';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<AdminAnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchAdminAnalyticsSnapshot(30);
    if (result.error) {
      if (result.error.message.includes('forbidden') || result.error.message.includes('Admin session')) {
        navigate('/dashboard');
        return;
      }
      setError(result.error.message);
      setSnapshot(null);
    } else {
      setSnapshot(result.data);
    }
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminSectionPage
      title="Analytics"
      route="/admin/analytics"
      description="Platform metrics from admin analytics RPCs."
      actions={[
        { label: 'Refresh', onClick: load, variant: 'secondary', disabled: loading },
        {
          label: 'Export data',
          to: '/admin/analytics/export',
          variant: 'primary',
          icon: '📊',
        },
      ]}
      links={[
        { label: 'Reports', to: '/admin/reports', icon: '📄' },
        { label: 'Payments', to: '/admin/payments', icon: '💵' },
      ]}
    >
      {error ? <div className="admin-alert admin-alert--danger">{error}</div> : null}
      {loading && !snapshot ? (
        <AdminLoadingState label="Loading analytics…" />
      ) : snapshot ? (
        <AdminAnalyticsView snapshot={snapshot} />
      ) : null}
    </AdminSectionPage>
  );
}
