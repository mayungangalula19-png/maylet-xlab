import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import {
  loadEnterpriseHub,
  updateEnterpriseOrganization,
} from '../../../lib/enterprise/enterpriseHub.service';
import type { EnterpriseHubSnapshot } from '../../../types/enterpriseHub.types';

export function useEnterpriseHub() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<EnterpriseHubSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    setError(null);
    try {
      const snapshot = await loadEnterpriseHub(user.id);
      setData(snapshot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load enterprise hub');
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const snapshot = await loadEnterpriseHub(user.id);
        if (!cancelled) setData(snapshot);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load enterprise hub');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  const saveOrganization = useCallback(
    async (organizationName: string): Promise<boolean> => {
      if (!user || !data) return false;
      setSavingOrg(true);
      setError(null);
      setOrgSuccess(null);
      try {
        await updateEnterpriseOrganization(user.id, { organization_name: organizationName });
        setData({
          ...data,
          profile: { ...data.profile, organization_name: organizationName.trim() },
        });
        setOrgSuccess('Organization profile saved.');
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save organization');
        return false;
      } finally {
        setSavingOrg(false);
      }
    },
    [user, data]
  );

  return {
    data,
    loading: authLoading || loading,
    refreshing,
    error,
    orgSuccess,
    savingOrg,
    refresh,
    saveOrganization,
    setError,
    setOrgSuccess,
  };
}
