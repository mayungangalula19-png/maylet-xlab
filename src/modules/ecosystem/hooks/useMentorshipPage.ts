import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase/client';
import { usePageLoad } from '../../../core/hooks/usePageLoad';
import { useModalState } from '../../../core/hooks/useModalState';
import { mentorshipService, type MentorRecord } from '../../../core';

export function useMentorshipPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof mentorshipService.getPageData>> | null>(null);
  const [activeTab, setActiveTab] = useState<'mentors' | 'sessions' | 'requests'>('mentors');
  const modal = useModalState<MentorRecord>();

  const reload = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    const pageData = await mentorshipService.getPageData(session.user.id);
    setData(pageData);
    setError(null);
  }, [navigate]);

  usePageLoad(async ({ cancelled }) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      const pageData = await mentorshipService.getPageData(session.user.id);
      if (cancelled()) return;
      setData(pageData);
    } catch (err) {
      if (!cancelled()) setError(err instanceof Error ? err.message : 'Failed to load mentorship data');
    } finally {
      if (!cancelled()) setLoading(false);
    }
  }, [navigate]);

  const submitRequest = useCallback(
    async (message: string) => {
      if (!modal.selected) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      try {
        await mentorshipService.submitRequest(modal.selected.id, session.user.id, message);
        alert('Request sent! The mentor will review your request.');
        modal.close();
        await reload();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send request';
        alert(`Failed to send request: ${msg}`);
      }
    },
    [modal, reload]
  );

  const cancelRequest = useCallback(
    async (requestId: string) => {
      if (!window.confirm('Cancel this mentorship request?')) return;
      try {
        await mentorshipService.cancelRequest(requestId);
        await reload();
      } catch {
        alert('Cancel failed');
      }
    },
    [reload]
  );

  return {
    loading,
    error,
    data,
    mentors: data?.mentors ?? [],
    requests: data?.requests ?? [],
    sessions: data?.sessions ?? [],
    activeTab,
    setActiveTab,
    modal,
    submitRequest,
    cancelRequest,
  };
}
