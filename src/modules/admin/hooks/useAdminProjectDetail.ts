import { useCallback, useEffect, useState } from 'react';
import { deleteAdminProject, fetchAdminProjectDetail } from '../services/adminProjects.service';
import type { AdminProjectDetailBundle } from '../types/projectAdmin.types';

export function useAdminProjectDetail(projectId: string | undefined) {
  const [bundle, setBundle] = useState<AdminProjectDetailBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(async () => {
    if (!projectId) {
      setBundle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const result = await fetchAdminProjectDetail(projectId);
    if (result.error) {
      setError(result.error.message);
      setBundle(null);
    } else {
      setBundle(result.data);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const remove = useCallback(async () => {
    if (!projectId || !bundle) return { ok: false as const, error: 'Project not loaded' };

    setDeleting(true);
    const result = await deleteAdminProject(projectId, bundle.project.name);
    setDeleting(false);

    if (result.error) {
      return { ok: false as const, error: result.error.message };
    }
    return { ok: true as const };
  }, [projectId, bundle]);

  return { bundle, loading, error, refreshing: loading && !!bundle, refresh, remove, deleting };
}
