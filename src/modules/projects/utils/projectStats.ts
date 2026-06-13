import type { ProjectListStats, ProjectViewModel } from '../types';

export function computeProjectStats(projects: ProjectViewModel[]): ProjectListStats {
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
      ? Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / total)
      : 0;

  return { total, inProgress, completed, onHold, avgProgress };
}
