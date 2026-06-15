import { supabase } from '../../lib/supabase/client';
import { getProjects } from '../../lib/supabase/projects.queries';
import type { Project } from '../../types/project.types';

export interface EcosystemLiveMetrics {
  innovators: number;
  startups: number;
  investors: number;
  mentors: number;
  partners: number;
  communities: number;
}

export interface EcosystemContextData {
  projects: Project[];
  metrics: EcosystemLiveMetrics | null;
}

class EcosystemService {
  async getContext(
    userId: string | undefined,
    defaultMetrics: () => EcosystemLiveMetrics
  ): Promise<EcosystemContextData> {
    if (!userId) return { projects: [], metrics: null };

    const projects = await getProjects(userId);
    const [{ count: teamCount }, { count: projectCount }] = await Promise.all([
      supabase.from('teams').select('*', { count: 'exact', head: true }).eq('owner_id', userId),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const base = defaultMetrics();
    return {
      projects,
      metrics: {
        innovators: base.innovators + (projectCount ?? 0),
        startups: base.startups + Math.max(0, (projectCount ?? 0) - 1),
        investors: base.investors,
        mentors: base.mentors,
        partners: base.partners,
        communities: base.communities + (teamCount ?? 0),
      },
    };
  }

  async getCurrentUserId(): Promise<string | null> {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  }
}

export const ecosystemService = new EcosystemService();
