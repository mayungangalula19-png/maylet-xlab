import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import {
  cancelSubscription,
  formatBillingError,
  loadBillingDashboard,
  reactivateSubscription,
  startCheckout,
  BillingSchemaNotReadyError,
} from '../services/billing.service';
import type { BillingCycle, BillingDashboardData, PlanId } from '../types/billing.types';

export function useBilling() {
  const [data, setData] = useState<BillingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaNotReady, setSchemaNotReady] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    setSchemaNotReady(false);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setData(null);
        return;
      }
      const dashboard = await loadBillingDashboard(user.id);
      setData(dashboard);
    } catch (e) {
      if (e instanceof BillingSchemaNotReadyError) {
        setSchemaNotReady(true);
        setData(null);
      } else {
        setError(formatBillingError(e));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upgradePlan = useCallback(
    async (planId: PlanId, billingCycle: BillingCycle) => {
      if (!data) return;
      setActionLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        await startCheckout(user.id, data.organization.id, planId, billingCycle, user.email ?? '');
        await refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upgrade failed');
      } finally {
        setActionLoading(false);
      }
    },
    [data, refresh]
  );

  const cancel = useCallback(async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await cancelSubscription(user.id, data.organization.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setActionLoading(false);
    }
  }, [data, refresh]);

  const reactivate = useCallback(async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await reactivateSubscription(user.id, data.organization.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reactivate failed');
    } finally {
      setActionLoading(false);
    }
  }, [data, refresh]);

  return {
    data,
    loading,
    error,
    schemaNotReady,
    actionLoading,
    refresh,
    upgradePlan,
    cancel,
    reactivate,
  };
}
