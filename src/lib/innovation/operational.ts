import { EMPTY } from './dashboardData';
import type { Project } from '../../types/project.types';
import { getInnovationStage } from './lifecycle';

export interface OperationalAction {
  id: string;
  title: string;
  detail: string;
  route: string;
  status: 'action_required' | 'complete_setup' | 'no_data';
}

export interface OperationalProjectItem {
  id: string;
  name: string;
  stage: string;
  detail: string;
  route: string;
}

const STALE_DAYS = 14;

export function computeOperationalActions(
  projects: Project[],
  documentCount: number,
  experimentCount: number,
  fundingPitchCount: number
): OperationalAction[] {
  const actions: OperationalAction[] = [];

  if (projects.length === 0) {
    actions.push({
      id: 'create-project',
      title: 'Create first project',
      detail: 'Complete Setup',
      route: '/projects?create=1',
      status: 'complete_setup',
    });
    return actions;
  }

  if (documentCount === 0) {
    actions.push({
      id: 'upload-docs',
      title: 'Upload documents',
      detail: 'Complete Setup',
      route: '/research',
      status: 'complete_setup',
    });
  }

  if (experimentCount === 0) {
    actions.push({
      id: 'create-experiment',
      title: 'Create experiment',
      detail: 'Complete Setup',
      route: '/experiments/create',
      status: 'complete_setup',
    });
  }

  if (fundingPitchCount === 0) {
    actions.push({
      id: 'funding-pitch',
      title: 'Create funding pitch',
      detail: 'Not Available Yet',
      route: '/funding/create',
      status: 'no_data',
    });
  }

  const stale = projects.filter((p) => {
    const days = (Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > STALE_DAYS;
  });
  for (const p of stale.slice(0, 2)) {
    actions.push({
      id: `stale-${p.id}`,
      title: `Update ${p.name}`,
      detail: 'Action Required',
      route: `/projects/${p.id}/edit`,
      status: 'action_required',
    });
  }

  return actions.slice(0, 6);
}

export function computeOperationalQueues(projects: Project[]): {
  actionRequired: OperationalProjectItem[];
  completeSetup: OperationalProjectItem[];
  fundingReady: OperationalProjectItem[];
  validationReady: OperationalProjectItem[];
} {
  const actionRequired: OperationalProjectItem[] = [];
  const completeSetup: OperationalProjectItem[] = [];
  const fundingReady: OperationalProjectItem[] = [];
  const validationReady: OperationalProjectItem[] = [];

  for (const p of projects) {
    const stage = getInnovationStage(p);
    const item: OperationalProjectItem = {
      id: p.id,
      name: p.name,
      stage,
      detail: `${p.status} · ${p.progress}%`,
      route: `/projects/${p.id}`,
    };

    const days = (Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (days > STALE_DAYS) actionRequired.push({ ...item, detail: EMPTY.ACTION_REQUIRED });

    if (p.status === 'Idea' && p.progress < 10) {
      completeSetup.push({ ...item, detail: EMPTY.COMPLETE_SETUP });
    }

    if (stage === 'Funding' || p.status === 'Launched') {
      fundingReady.push(item);
    }

    if (stage === 'Experiment' || stage === 'Validation' || p.status === 'Prototype') {
      validationReady.push(item);
    }
  }

  return {
    actionRequired: actionRequired.slice(0, 4),
    completeSetup: completeSetup.slice(0, 4),
    fundingReady: fundingReady.slice(0, 4),
    validationReady: validationReady.slice(0, 4),
  };
}
