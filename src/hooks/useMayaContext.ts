import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { buildMayaContext } from '../lib/maya/context-builder';
import { fetchMayaAlerts } from '../services/maya.service';
import type { MayaContext, MayaAlert } from '../lib/maya/types';
import { listProjectsByUser } from '../services/projects.service';

export function useMayaContext(projectId?: string) {
  const { user } = useAuth();
  const [context, setContext] = useState<MayaContext | null>(null);
  const [alerts, setAlerts] = useState<MayaAlert[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [ctx, alertList, projectList] = await Promise.all([
          buildMayaContext({
            userId: user.id,
            userName: user.user_metadata?.full_name as string | undefined,
            userType: user.user_metadata?.user_type as string | undefined,
            projectId,
          }),
          fetchMayaAlerts(user.id),
          listProjectsByUser(user.id),
        ]);
        setContext(ctx);
        setAlerts(alertList as MayaAlert[]);
        setProjects(projectList.map((p) => ({ id: p.id, name: p.name })));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, projectId]);

  return { context, alerts, projects, loading, setProjectId: () => {} };
}
