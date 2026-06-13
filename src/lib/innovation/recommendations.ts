import type { Project } from '../../types/project.types';
import {
  getInnovationMetrics,
  getInnovationStage,
  type InnovationStage,
} from './lifecycle';

export const STAGE_DISPLAY_LABELS: Record<InnovationStage, string> = {
  Idea: 'Ideas',
  Research: 'Research',
  Prototype: 'Prototypes',
  Experiment: 'Experiments',
  Validation: 'Validated Innovations',
  Funding: 'Funded Projects',
  Commercialization: 'Commercialized Products',
};

export interface RecommendedAction {
  id: string;
  label: string;
  description: string;
  route: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ProjectPriority {
  id: string;
  name: string;
  stage: InnovationStage;
  score: number;
  route: string;
}

export interface ExecutiveSummary {
  totalInnovationAssets: number;
  activeProjects: number;
  researchProgress: number;
  fundingOpportunityCount: number;
  ecosystemHealthScore: number;
  projectCount: number;
  documentCount: number;
  vaultCount: number;
}

export interface MayaProjectRecommendation {
  summary: string;
  nextStep: string;
  actionRoute: string;
  factors: string[];
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  route: string;
  priority: 'high' | 'medium';
}

export interface CommercializationBreakdown {
  marketValidation: number;
  prototypeStatus: number;
  businessModelReadiness: number;
  goToMarketReadiness: number;
  customerValidation: number;
  revenuePotential: number;
  commercializationScore: number;
  projectId?: string;
  projectName?: string;
}

export interface FundingReadinessDetail {
  projectId: string;
  projectName: string;
  fundingReadiness: number;
  investmentPotential: number;
  missingRequirements: string[];
  recommendedSources: string[];
  route: string;
}

const ACTION_CATALOG: RecommendedAction[] = [
  {
    id: 'research-doc',
    label: 'Create Research Document',
    description: 'Document findings and literature review',
    route: '/documents',
    priority: 'high',
  },
  {
    id: 'run-experiment',
    label: 'Run Experiment',
    description: 'Validate hypotheses with structured tests',
    route: '/experiments/create',
    priority: 'high',
  },
  {
    id: 'upload-proposal',
    label: 'Upload Proposal',
    description: 'Prepare funding or research proposal',
    route: '/documents',
    priority: 'medium',
  },
  {
    id: 'add-team',
    label: 'Add Team Members',
    description: 'Invite collaborators to your innovation',
    route: '/teams/create',
    priority: 'medium',
  },
  {
    id: 'search-funding',
    label: 'Search Funding',
    description: 'Explore grants, investors, and accelerators',
    route: '/funding',
    priority: 'high',
  },
  {
    id: 'complete-validation',
    label: 'Complete Validation',
    description: 'Finalize market and user validation',
    route: '/projects',
    priority: 'high',
  },
];

const FUNDING_SOURCES = [
  'African Innovation Grant',
  'Climate Tech Fund',
  'Angel Investor Network',
  'University Research Fund',
];

export function generateMayaProjectRecommendation(project: Project): MayaProjectRecommendation {
  const m = getInnovationMetrics(project);
  const factors: string[] = [];
  const actionRoute = `/projects/${project.id}`;

  factors.push(`Stage: ${m.stage} (${m.progress}% complete)`);
  factors.push(`Readiness: ${m.readinessScore}/100 · Risk: ${m.riskLevel}`);

  if (project.team_size <= 1) {
    factors.push('Team: solo — consider inviting collaborators');
  } else {
    factors.push(`Team: ${project.team_size} members active`);
  }

  if (m.fundingReadiness >= 70) {
    factors.push(`Funding readiness: ${m.fundingReadiness}% — eligible for investor outreach`);
  } else {
    factors.push(`Funding readiness: ${m.fundingReadiness}% — strengthen validation first`);
  }

  if (project.tasks_total > 0) {
    const taskPct = Math.round((project.tasks_completed / project.tasks_total) * 100);
    factors.push(`Experiment tasks: ${project.tasks_completed}/${project.tasks_total} (${taskPct}%)`);
  }

  let nextStep = m.nextAction;
  let summary = `${project.name} is in the ${m.stage} stage with ${m.readinessScore}% readiness.`;

  if (m.riskLevel === 'high') {
    summary = `${project.name} needs attention — high risk at ${m.stage} with ${m.progress}% progress.`;
    nextStep = m.missingRequirements.length > 0
      ? `Address: ${m.missingRequirements.join(' and ')}`
      : m.nextAction;
  } else if (m.stage === 'Funding' || m.fundingReadiness >= 70) {
    summary = `${project.name} is funding-ready at ${m.fundingReadiness}% — prioritize grant and investor applications.`;
    nextStep = 'Prepare pitch deck and apply to matching funding sources';
  } else if (m.stage === 'Experiment' || m.stage === 'Prototype') {
    summary = `${project.name} is in validation phase — experiments drive your next milestone.`;
    nextStep = project.tasks_completed < project.tasks_total
      ? 'Complete pending experiment tasks to advance validation'
      : m.nextAction;
  } else if (m.stage === 'Research' || m.stage === 'Idea') {
    summary = `${project.name} is in early research — document findings to unlock prototyping.`;
    nextStep = 'Upload research notes and complete literature review';
  } else if (m.commercializationReadiness >= 70) {
    summary = `${project.name} is approaching commercialization (${m.commercializationReadiness}% ready).`;
    nextStep = 'Execute go-to-market plan and customer validation';
  }

  return { summary, nextStep, actionRoute, factors };
}

export function generateSystemAlerts(
  projects: Project[],
  fundingOpportunityCount: number
): SystemAlert[] {
  const alerts: SystemAlert[] = [];

  if (projects.length === 0) {
    alerts.push({
      id: 'onboard-project',
      title: 'Start your innovation journey',
      message: 'Create your first project to unlock MAYA guidance, funding matches, and pipeline tracking.',
      route: '/projects?create=1',
      priority: 'high',
    });
    alerts.push({
      id: 'onboard-research',
      title: 'Build your knowledge base',
      message: 'Upload research notes and literature reviews to strengthen funding applications.',
      route: '/documents',
      priority: 'medium',
    });
    return alerts;
  }

  const priorities = computeDashboardPriorities(projects);
  if (priorities.atRisk.length > 0) {
    alerts.push({
      id: 'at-risk',
      title: `${priorities.atRisk.length} project(s) at risk`,
      message: `Review ${priorities.atRisk[0].name} — stalled progress or high risk detected.`,
      route: priorities.atRisk[0].route,
      priority: 'high',
    });
  }
  if (priorities.readyForFunding.length > 0) {
    alerts.push({
      id: 'funding-ready',
      title: 'Funding opportunity available',
      message: `${priorities.readyForFunding[0].name} meets funding readiness criteria.`,
      route: '/funding',
      priority: 'high',
    });
  }
  if (fundingOpportunityCount > 0) {
    alerts.push({
      id: 'funding-matches',
      title: `${fundingOpportunityCount} funding sources matched`,
      message: 'Explore grants, investors, and accelerators aligned to your portfolio.',
      route: '/funding',
      priority: 'medium',
    });
  }

  const stale = projects.filter((p) => {
    const days = (Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > 14;
  });
  if (stale.length > 0) {
    alerts.push({
      id: 'stale-projects',
      title: `${stale.length} project(s) need updates`,
      message: `Last activity on ${stale[0].name} was over 2 weeks ago.`,
      route: `/projects/${stale[0].id}`,
      priority: 'medium',
    });
  }

  return alerts.slice(0, 3);
}

export function getInnovationOnboardingSteps(projects: Project[]): { id: string; label: string; route: string }[] {
  if (projects.length === 0) {
    return [
      { id: 'create', label: 'Create your first innovation project', route: '/projects?create=1' },
      { id: 'research', label: 'Upload research notes and literature', route: '/documents' },
      { id: 'team', label: 'Invite collaborators to your team', route: '/teams/create' },
      { id: 'maya', label: 'Get MAYA recommendations for your idea', route: '/ai-assistant' },
    ];
  }
  const top = projects[0];
  const m = getInnovationMetrics(top);
  const steps = [
    { id: 'update', label: `Update progress on ${top.name}`, route: `/projects/${top.id}/edit` },
  ];
  if (m.stage === 'Idea' || m.stage === 'Research') {
    steps.push({ id: 'doc', label: 'Add research documentation', route: '/documents' });
  }
  if (m.stage === 'Prototype' || m.stage === 'Experiment') {
    steps.push({ id: 'exp', label: 'Run a validation experiment', route: `/experiments/new?projectId=${top.id}` });
  }
  if (m.fundingReadiness >= 50) {
    steps.push({ id: 'fund', label: 'Search matching funding opportunities', route: '/funding' });
  }
  steps.push({ id: 'maya', label: 'Run MAYA analysis on your project', route: `/ai-assistant/analyze?projectId=${top.id}` });
  return steps.slice(0, 4);
}

export function generateRecommendedActions(projects: Project[]): RecommendedAction[] {
  if (projects.length === 0) {
    return ACTION_CATALOG.slice(0, 4);
  }

  const top = projects[0];
  const stage = getInnovationStage(top);
  const picks: string[] = [];

  if (stage === 'Idea' || stage === 'Research') picks.push('research-doc', 'upload-proposal');
  if (stage === 'Experiment' || stage === 'Prototype') picks.push('run-experiment');
  if (stage === 'Validation') picks.push('complete-validation');
  if (stage === 'Funding' || stage === 'Commercialization') picks.push('search-funding');
  picks.push('add-team', 'search-funding');

  const unique = [...new Set(picks)];
  return unique
    .map((id) => ACTION_CATALOG.find((a) => a.id === id))
    .filter((a): a is RecommendedAction => !!a)
    .slice(0, 6);
}

export function computeExecutiveSummary(
  projects: Project[],
  documentCount: number,
  vaultCount: number,
  fundingOpportunityCount = 0
): ExecutiveSummary {
  const projectCount = projects.length;
  const totalInnovationAssets = projectCount + documentCount + vaultCount;

  const activeProjects = projects.filter((p) => {
    const s = getInnovationStage(p);
    return s !== 'Commercialization' && p.status !== 'Launched';
  }).length;

  const pastResearch = projects.filter((p) => {
    const s = getInnovationStage(p);
    return s !== 'Idea' && s !== 'Research';
  }).length;
  const researchProgress =
    projectCount > 0 ? Math.round((pastResearch / projectCount) * 100) : 0;

  const avgReadiness =
    projectCount > 0
      ? projects.reduce((s, p) => s + getInnovationMetrics(p).readinessScore, 0) / projectCount
      : 0;
  const avgFunding =
    projectCount > 0
      ? projects.reduce((s, p) => s + getInnovationMetrics(p).fundingReadiness, 0) / projectCount
      : 0;
  const experimentCount = projects.filter((p) => getInnovationStage(p) === 'Experiment').length;
  const experimentRatio = projectCount > 0 ? (experimentCount / projectCount) * 100 : 0;

  const ecosystemHealthScore = Math.min(
    100,
    Math.round(avgReadiness * 0.35 + avgFunding * 0.25 + experimentRatio * 0.2 + (documentCount > 0 ? 10 : 0) + (vaultCount > 0 ? 10 : 0))
  );

  return {
    totalInnovationAssets,
    activeProjects,
    researchProgress,
    fundingOpportunityCount,
    ecosystemHealthScore,
    projectCount,
    documentCount,
    vaultCount,
  };
}

export function computeDashboardPriorities(projects: Project[]): {
  highPriority: ProjectPriority[];
  atRisk: ProjectPriority[];
  readyForFunding: ProjectPriority[];
  readyForValidation: ProjectPriority[];
  readyForCommercialization: ProjectPriority[];
} {
  const highPriority: ProjectPriority[] = [];
  const atRisk: ProjectPriority[] = [];
  const readyForFunding: ProjectPriority[] = [];
  const readyForValidation: ProjectPriority[] = [];
  const readyForCommercialization: ProjectPriority[] = [];

  for (const p of projects) {
    const m = getInnovationMetrics(p);
    const entry: ProjectPriority = {
      id: p.id,
      name: p.name,
      stage: m.stage,
      score: m.readinessScore,
      route: `/projects/${p.id}`,
    };

    if (m.riskLevel === 'high') atRisk.push({ ...entry, score: m.innovationScore });
    if (m.fundingReadiness >= 70) readyForFunding.push({ ...entry, score: m.fundingReadiness });
    if (m.stage === 'Experiment' || m.stage === 'Prototype') {
      if (m.readinessScore >= 60) readyForValidation.push({ ...entry, score: m.readinessScore });
    }
    if (m.commercializationReadiness >= 70)
      readyForCommercialization.push({ ...entry, score: m.commercializationReadiness });

    const daysSinceUpdate =
      (Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 14 || (m.readinessScore < 50 && m.innovationScore > 60)) {
      highPriority.push(entry);
    }
  }

  return {
    highPriority: highPriority.slice(0, 3),
    atRisk: atRisk.slice(0, 3),
    readyForFunding: readyForFunding.slice(0, 3),
    readyForValidation: readyForValidation.slice(0, 3),
    readyForCommercialization: readyForCommercialization.slice(0, 3),
  };
}

export function getFundingReadinessDetails(projects: Project[]): FundingReadinessDetail[] {
  return projects.slice(0, 3).map((p) => {
    const m = getInnovationMetrics(p);
    return {
      projectId: p.id,
      projectName: p.name,
      fundingReadiness: m.fundingReadiness,
      investmentPotential: Math.min(100, Math.round(m.innovationScore * 0.7 + m.fundingReadiness * 0.3)),
      missingRequirements: m.missingRequirements,
      recommendedSources: FUNDING_SOURCES.slice(0, 2),
      route: `/projects/${p.id}`,
    };
  });
}

export function getCommercializationBreakdown(project: Project | null): CommercializationBreakdown {
  if (!project) {
    return {
      marketValidation: 0,
      prototypeStatus: 0,
      businessModelReadiness: 0,
      goToMarketReadiness: 0,
      customerValidation: 0,
      revenuePotential: 0,
      commercializationScore: 0,
    };
  }

  const m = getInnovationMetrics(project);
  const stage = m.stage;

  const marketValidation = stage === 'Validation' || stage === 'Funding' || stage === 'Commercialization'
    ? Math.min(100, m.readinessScore + 10)
    : Math.round(m.progress * 0.5);
  const prototypeStatus =
    stage === 'Prototype' || stage === 'Experiment'
      ? m.progress
      : stage === 'Validation' || stage === 'Funding' || stage === 'Commercialization'
        ? 85
        : Math.round(m.progress * 0.4);
  const businessModelReadiness = Math.round(m.fundingReadiness * 0.85);
  const goToMarketReadiness = m.commercializationReadiness;
  const customerValidation = Math.round(marketValidation * 0.9);
  const revenuePotential = Math.min(100, Math.round(m.innovationScore * 0.5 + m.fundingReadiness * 0.35));
  const commercializationScore = Math.round(
    (marketValidation + prototypeStatus + businessModelReadiness + goToMarketReadiness) / 4
  );

  return {
    marketValidation,
    prototypeStatus,
    businessModelReadiness,
    goToMarketReadiness,
    customerValidation,
    revenuePotential,
    commercializationScore,
    projectId: project.id,
    projectName: project.name,
  };
}
