import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { usePageLoad } from '../../../core/hooks/usePageLoad';
import { useModalState } from '../../../core/hooks/useModalState';
import {
  ecosystemService,
  hackathonsService,
  type HackathonRecord,
  type HackathonRegistration,
} from '../../../core';

export function useHackathonsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    hackathons: HackathonRecord[];
    registrations: HackathonRegistration[];
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const modal = useModalState<HackathonRecord>();

  useEffect(() => {
    void ecosystemService.getCurrentUserId().then((id) => {
      if (!id) navigate('/login');
      else setUserId(id);
    });
  }, [navigate]);

  const reloadHackathons = useCallback(async () => {
    const hackathons = await hackathonsService.getHackathons(statusFilter, modeFilter);
    setData((prev) => ({ hackathons, registrations: prev?.registrations ?? [] }));
  }, [statusFilter, modeFilter]);

  usePageLoad(async ({ cancelled }) => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [hackathons, registrations] = await Promise.all([
        hackathonsService.getHackathons(statusFilter, modeFilter),
        hackathonsService.getRegistrations(userId),
      ]);
      if (cancelled()) return;
      setData({ hackathons, registrations });
    } catch (err) {
      if (!cancelled()) setError(err instanceof Error ? err.message : 'Failed to load hackathons');
    } finally {
      if (!cancelled()) setLoading(false);
    }
  }, [userId, statusFilter, modeFilter]);

  useEffect(() => {
    const channel = supabase
      .channel('hackathons')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hackathons' }, () => {
        void reloadHackathons();
      })
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [reloadHackathons]);

  const register = useCallback(
    async (hackathonId: string) => {
      if (!userId || !data) return;
      const hackathon = data.hackathons.find((h) => h.id === hackathonId);
      if (!hackathon) return;
      if (hackathon.max_participants && hackathon.registered_count >= hackathon.max_participants) {
        alert('This hackathon has reached its maximum number of participants.');
        return;
      }
      try {
        await hackathonsService.joinHackathon(hackathonId, userId);
        const [hackathons, registrations] = await Promise.all([
          hackathonsService.getHackathons(statusFilter, modeFilter),
          hackathonsService.getRegistrations(userId),
        ]);
        setData({ hackathons, registrations });
        alert('Successfully registered!');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        alert(`Registration failed: ${message}`);
      }
    },
    [data, modeFilter, statusFilter, userId]
  );

  const isRegistered = useCallback(
    (hackathonId: string) => (data?.registrations ?? []).some((r) => r.hackathon_id === hackathonId),
    [data]
  );

  return {
    loading,
    error,
    data,
    hackathons: data?.hackathons ?? [],
    statusFilter,
    setStatusFilter,
    modeFilter,
    setModeFilter,
    modal,
    register,
    isRegistered,
  };
}
