import type {
  ProjectRecommendation,
  ProjectResearchSnapshot,
  ResearchFinding,
  ResearchImpactResult,
} from '../research/types/research.types';
import { scanFindings } from '../research/ai/insightEngine';
import { detectKnowledgeGaps } from '../research/ai/mayaResearchAI';

interface ProjectRef {
  id: string;
  name: string;
  sector: string;
  status: string;
  progress: number;
}

function matchSector(findingText: string, project: ProjectRef): boolean {
  const t = findingText.toLowerCase();
  const sector = project.sector.toLowerCase();
  const name = project.name.toLowerCase();
  return t.includes(sector) || t.includes(name) || sector.split(/\s+/).some((w) => w.length > 3 && t.includes(w));
}

export function analyzeResearchImpact(
  researchId: string,
  finding: ResearchFinding,
  projects: ProjectRef[]
): ResearchImpactResult {
  const text = `${finding.title} ${finding.content}`;
  const signals = scanFindings([finding])[0];

  const impactedProjects = projects
    .filter((p) => p.id === finding.project_id || matchSector(text, p))
    .map((p) => ({
      projectId: p.id,
      projectName: p.name,
      reason: p.id === finding.project_id ? 'Direct project link' : `Sector/name match (${p.sector})`,
    }));

  const suggestedActions: ResearchImpactResult['suggestedActions'] = [];

  if (signals?.signals.includes('risk')) {
    suggestedActions.push({
      id: 'risk-review',
      type: 'risk',
      title: 'Review project risk posture',
      detail: `Finding "${finding.title}" contains risk indicators.`,
      confidence: 72,
    });
  }

  if (signals?.signals.includes('priority')) {
    suggestedActions.push({
      id: 'priority-bump',
      type: 'priority',
      title: 'Elevate project priority',
      detail: 'Research signals urgency — consider prioritizing related work.',
      confidence: 68,
    });
  }

  if (finding.finding_type === 'insight' || finding.finding_type === 'conclusion') {
    suggestedActions.push({
      id: 'task-validate',
      type: 'task',
      title: 'Create validation task',
      detail: `Validate insight: ${finding.title}`,
      confidence: 80,
    });
  }

  if (signals?.signals.includes('opportunity')) {
    suggestedActions.push({
      id: 'status-advance',
      type: 'status',
      title: 'Consider advancing innovation stage',
      detail: 'Positive research signal detected — evaluate readiness for prototype.',
      confidence: 65,
    });
  }

  const riskChanges = impactedProjects
    .filter(() => signals?.signals.includes('risk'))
    .map((p) => ({
      projectId: p.projectId,
      from: 'current',
      to: 'elevated',
      reason: finding.title,
    }));

  const priorityAdjustments = impactedProjects
    .filter(() => signals?.signals.includes('priority'))
    .map((p) => ({
      projectId: p.projectId,
      suggestion: 'Increase priority',
      reason: finding.title,
    }));

  return {
    researchId,
    impactedProjects,
    suggestedActions,
    riskChanges,
    priorityAdjustments,
  };
}

export function applyResearchToProject(
  project: ProjectRef,
  snapshot: ProjectResearchSnapshot
): {
  priority: string;
  statusSuggestion: string;
  suggestedTasks: string[];
  riskLevel: string;
} {
  const gaps = detectKnowledgeGaps({ projectName: project.name, snapshot });
  const riskSignals = scanFindings(snapshot.findings).filter((s) => s.signals.includes('risk'));

  const suggestedTasks: string[] = [];
  if (gaps.includes('No literature sources recorded')) suggestedTasks.push('Add literature sources');
  if (gaps.includes('No findings repository entries')) suggestedTasks.push('Document key findings');
  if (gaps.includes('Problem statement missing')) suggestedTasks.push('Complete problem definition');

  for (const f of snapshot.findings.slice(0, 2)) {
    suggestedTasks.push(`Follow up: ${f.title}`);
  }

  let riskLevel = 'low';
  if (riskSignals.length >= 2) riskLevel = 'high';
  else if (riskSignals.length === 1) riskLevel = 'medium';

  let statusSuggestion = project.status;
  if (snapshot.completionRate >= 70 && project.progress < 50) {
    statusSuggestion = 'Prototype';
  } else if (snapshot.completionRate < 30) {
    statusSuggestion = 'Idea';
  }

  const priority =
    riskSignals.length > 0 ? 'high' : snapshot.completionRate < 40 ? 'medium' : 'normal';

  return { priority, statusSuggestion, suggestedTasks, riskLevel };
}

export function generateProjectRecommendations(
  project: ProjectRef,
  snapshot: ProjectResearchSnapshot
): ProjectRecommendation {
  const applied = applyResearchToProject(project, snapshot);
  const gaps = detectKnowledgeGaps({ projectName: project.name, snapshot });

  const nextSteps: string[] = [];
  if (snapshot.completionRate < 50) nextSteps.push('Complete problem definition and literature review');
  if (snapshot.findings.length > 0) nextSteps.push('Design experiments to validate top findings');
  if (snapshot.documents.length > 0) nextSteps.push('Cross-reference uploaded documents with findings');
  if (nextSteps.length === 0) nextSteps.push('Begin structured research documentation');

  const timelineChanges: string[] = [];
  if (applied.riskLevel === 'high') timelineChanges.push('Add risk review milestone within 7 days');
  if (snapshot.completionRate >= 70) timelineChanges.push('Target prototype phase in next sprint');

  const riskScore =
    applied.riskLevel === 'high' ? 75 : applied.riskLevel === 'medium' ? 45 : gaps.length > 4 ? 35 : null;

  return {
    nextSteps,
    taskSuggestions: applied.suggestedTasks,
    timelineChanges,
    riskScore,
    explanation: `Based on ${snapshot.findings.length} findings, ${gaps.length} knowledge gaps, and ${applied.riskLevel} risk level.`,
  };
}
