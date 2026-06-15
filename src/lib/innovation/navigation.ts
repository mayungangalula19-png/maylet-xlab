import type { InnovationStage } from './lifecycle';

/** Route for a lifecycle stage filter / deep-link */
export function getInnovationStageRoute(stage: InnovationStage): string {
  return `/projects?stage=${encodeURIComponent(stage)}`;
}

/** Best next-step route for a project at a given stage */
export function getStageActionRoute(stage: InnovationStage, projectId: string): string {
  switch (stage) {
    case 'Idea':
      return `/projects/${projectId}/edit`;
    case 'Research':
      return `/research/${projectId}`;
    case 'Prototype':
      return '/prototypes';
    case 'Experiment':
      return `/experiments/create?projectId=${projectId}`;
    case 'Validation':
      return `/projects/${projectId}`;
    case 'Funding':
      return '/funding/create';
    case 'Commercialization':
      return `/projects/${projectId}`;
    default:
      return `/projects/${projectId}`;
  }
}

/** Route for activity timeline items */
export function getActivityRoute(type: string, projectId?: string): string {
  const t = type.toLowerCase();
  if (t.includes('experiment')) return projectId ? `/experiments/create?projectId=${projectId}` : '/experiments';
  if (t.includes('document') || t.includes('research')) return projectId ? `/research/${projectId}` : '/research';
  if (t.includes('team')) return '/teams';
  if (t.includes('funding') || t.includes('pitch')) return '/funding';
  if (t.includes('ai') || t.includes('maya')) return '/ai-assistant';
  if (t.includes('project') && projectId) return `/projects/${projectId}`;
  return projectId ? `/projects/${projectId}` : '/projects';
}

/** KPI deep-link with optional stage filter */
export function getKpiRoute(key: string): string {
  const routes: Record<string, string> = {
    total: '/projects',
    activeResearch: '/research',
    runningExperiments: '/experiments',
    validatedInnovations: '/projects?stage=Validation',
    fundingOpportunities: '/funding',
    teamMembers: '/teams',
    documentsUploaded: '/research',
  };
  return routes[key] ?? '/projects';
}
