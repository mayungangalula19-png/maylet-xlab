import { useMemo } from 'react';
import type { Project, ProjectStats } from '../types/project.types';
import { computeStageCounts } from '../types/project.types';

export function useProjectStats(projects: Project[]): ProjectStats {
  return useMemo(() => {
    const total = projects.length;
    const inProgress = projects.filter(
      (p) => p.status === 'Experiment' || p.status === 'Prototype'
    ).length;
    const completed = projects.filter(
      (p) => p.status === 'Launched' || p.progress === 100
    ).length;
    const onHold = projects.filter((p) => p.status === 'Idea').length;
    const avgProgress =
      total > 0
        ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / total)
        : 0;
    const stageCounts = computeStageCounts(projects);

    return { total, inProgress, completed, onHold, avgProgress, stageCounts };
  }, [projects]);
}
